/** Restricted local PNG replay manifest; no provider authenticity implied. Author: John Khan. */
import type { TourState } from "./contract.js";

export const OFFLINE_IMPORT_FORMAT = "beljour-local-png-replay/1";
export const OFFLINE_IMPORT_MAX_MANIFEST = 8192;
export const OFFLINE_IMPORT_MAX_PNG = 48 * 1024 * 1024;
export const OFFLINE_IMPORT_MAX_PIXELS = 12_000_000;
export const OFFLINE_IMPORT_LABEL = "LOCAL PNG · ORIGIN NOT VERIFIED";

export type OfflineImportFamily = "hair" | "makeup" | "skin";
export type OfflineImportPhase =
  "empty" | "checking" | "ready" | "refused" | "stale" | "disposed";

export interface OfflineImportManifest {
  readonly format: typeof OFFLINE_IMPORT_FORMAT;
  readonly family: OfflineImportFamily;
  readonly mediaType: "image/png";
  readonly width: number;
  readonly height: number;
  readonly size: number;
  readonly sha256: string;
  readonly source: "operator-supplied-unverified";
  readonly scene: "drawn-pair";
  readonly providerVerified: false;
  readonly realFaceTested: false;
  readonly unitsSpentByViewer: 0;
}

export interface OfflineImportAuthority {
  readonly sourceRevision: number;
  readonly selectedId: "drawn-main" | "drawn-second";
  readonly family: OfflineImportFamily;
  readonly levelsFingerprint: string;
}

export interface OfflineImportStatus {
  readonly phase: OfflineImportPhase;
  readonly message: string;
  readonly family: OfflineImportFamily | null;
  readonly width: number | null;
  readonly height: number | null;
  readonly verifiedFileIntegrity: boolean;
  readonly verifiedProviderOrigin: false;
  readonly verifiedRealFaceQuality: false;
  readonly providerCalls: 0;
  readonly unitsSpent: 0;
  readonly imageUploaded: false;
  readonly imagePersisted: false;
}

const MANIFEST_KEYS = [
  "family", "format", "height", "mediaType", "providerVerified", "realFaceTested",
  "scene", "sha256", "size", "source", "unitsSpentByViewer", "width",
] as const;

const HEX_DIGEST = /^[0-9a-f]{64}$/;
const FAMILIES = new Set<OfflineImportFamily>(["hair", "makeup", "skin"]);

const PHASE_MESSAGES: Record<OfflineImportPhase, string> = {
  empty: "Choose a local manifest and PNG to inspect without a network request.",
  checking: "Checking only local bytes. No image is being uploaded.",
  ready: "PNG bytes match the selected manifest. Provider origin remains unverified.",
  refused: "Local replay was refused. No live provider fallback will run.",
  stale: "Selected subject or consent changed. The local replay was cleared.",
  disposed: "Local replay has ended and its temporary image URL was released.",
};

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError("Local replay manifest must be a JSON object");
  }
  return value as Record<string, unknown>;
}

function checkedInteger(value: unknown, name: string, ceiling: number): number {
  if (!Number.isSafeInteger(value) || typeof value !== "number" || value < 1 || value > ceiling) {
    throw new RangeError(`Invalid ${name} in local replay manifest`);
  }
  return value;
}

/** Exact-shape parsing rejects unknown keys, credentials, arbitrary URLs and elevated claims. */
export function checkedOfflineImportManifest(value: unknown): OfflineImportManifest {
  const data = record(value);
  const names = Object.keys(data).sort();
  if (JSON.stringify(names) !== JSON.stringify(MANIFEST_KEYS)) {
    throw new RangeError("Unexpected local replay manifest fields");
  }
  if (data.format !== OFFLINE_IMPORT_FORMAT || data.mediaType !== "image/png") {
    throw new RangeError("Unknown local replay format or image type");
  }
  if (!FAMILIES.has(data.family as OfflineImportFamily)) {
    throw new RangeError("Unknown local replay category");
  }
  if (data.scene !== "drawn-pair" || data.source !== "operator-supplied-unverified") {
    throw new RangeError("The local replay scene or origin claim is unsupported");
  }
  if (data.providerVerified !== false || data.realFaceTested !== false
    || data.unitsSpentByViewer !== 0) {
    throw new RangeError("Local files cannot assert provider or release acceptance");
  }
  if (typeof data.sha256 !== "string" || !HEX_DIGEST.test(data.sha256)) {
    throw new RangeError("Missing local replay image digest");
  }
  const width = checkedInteger(data.width, "width", 12000);
  const height = checkedInteger(data.height, "height", 12000);
  const size = checkedInteger(data.size, "size", OFFLINE_IMPORT_MAX_PNG);
  if (width * height > OFFLINE_IMPORT_MAX_PIXELS) {
    throw new RangeError("Local replay image exceeds the dimension limit");
  }
  return Object.freeze({
    format: OFFLINE_IMPORT_FORMAT,
    family: data.family as OfflineImportFamily,
    mediaType: "image/png" as const,
    width,
    height,
    size,
    sha256: data.sha256,
    source: "operator-supplied-unverified" as const,
    scene: "drawn-pair" as const,
    providerVerified: false as const,
    realFaceTested: false as const,
    unitsSpentByViewer: 0 as const,
  });
}

/** A bounded UTF-8 JSON file is parsed without retaining its original text. */
export async function parseOfflineManifest(blob: Blob): Promise<OfflineImportManifest> {
  if (!(blob instanceof Blob) || blob.size < 40 || blob.size > OFFLINE_IMPORT_MAX_MANIFEST) {
    throw new RangeError("Local manifest is empty or exceeds 8 KiB");
  }
  if (blob.type && !["application/json", "text/plain", "application/octet-stream"].includes(blob.type)) {
    throw new TypeError("Local replay manifest must be JSON");
  }
  const raw: unknown = JSON.parse(await blob.text());
  return checkedOfflineImportManifest(raw);
}

/** A replay is allowed only for the selected, consenting drawn subject. */
export function offlineImportAuthority(
  state: TourState,
  drawn: boolean,
  family: OfflineImportFamily,
): OfflineImportAuthority | null {
  if (!drawn || !state.sourceLoaded || !state.identityLock
    || !state.permissions.local || state.mockMode !== "off" && !state.permissions.mock) {
    return null;
  }
  if (family === "hair" ? !state.permissions.hair : !state.permissions.face) return null;
  const selected = state.selectedId;
  if (selected !== "drawn-main" && selected !== "drawn-second") return null;
  if (!Number.isSafeInteger(state.sourceRevision) || state.sourceRevision < 1) return null;
  const levels = Object.keys(state.levels).sort().map((key) => {
    const value = state.levels[key as keyof TourState["levels"]];
    return `${key}:${Number(value).toFixed(1)}`;
  });
  return Object.freeze({
    sourceRevision: state.sourceRevision,
    selectedId: selected,
    family,
    levelsFingerprint: levels.join("|"),
  });
}

export function sameOfflineImportAuthority(
  left: OfflineImportAuthority | null,
  right: OfflineImportAuthority | null,
): boolean {
  return left !== null && right !== null
    && left.sourceRevision === right.sourceRevision
    && left.selectedId === right.selectedId
    && left.family === right.family
    && left.levelsFingerprint === right.levelsFingerprint;
}

export function offlineImportStatus(
  phase: OfflineImportPhase,
  manifest: OfflineImportManifest | null = null,
): OfflineImportStatus {
  return Object.freeze({
    phase,
    message: PHASE_MESSAGES[phase],
    family: phase === "ready" ? manifest?.family ?? null : null,
    width: phase === "ready" ? manifest?.width ?? null : null,
    height: phase === "ready" ? manifest?.height ?? null : null,
    verifiedFileIntegrity: phase === "ready",
    verifiedProviderOrigin: false as const,
    verifiedRealFaceQuality: false as const,
    providerCalls: 0 as const,
    unitsSpent: 0 as const,
    imageUploaded: false as const,
    imagePersisted: false as const,
  });
}

/** No file name, URI, hash, personal content or biometric material is serialized. */
export function offlineImportEvidence(value: OfflineImportStatus): string {
  const phases: readonly OfflineImportPhase[] = [
    "empty", "checking", "ready", "refused", "stale", "disposed",
  ];
  if (!phases.includes(value.phase) || value.verifiedProviderOrigin !== false
    || value.verifiedRealFaceQuality !== false || value.providerCalls !== 0
    || value.unitsSpent !== 0 || value.imageUploaded !== false
    || value.imagePersisted !== false) {
    throw new RangeError("Invalid local replay evidence flags");
  }
  const report = {
    format: "beljour-local-replay-evidence/1",
    status: value.phase,
    category: value.phase === "ready" ? value.family : null,
    imageIntegrityChecked: value.phase === "ready",
    providerOriginVerified: false,
    realFaceGatePassed: false,
    providerRequests: 0,
    unitsSpent: 0,
    imageUploaded: false,
    imageStored: false,
  };
  return JSON.stringify(report);
}
