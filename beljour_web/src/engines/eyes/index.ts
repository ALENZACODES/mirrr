/** Stable eye/lash feature entry. Author: John Khan. */
export { FEATURES, LABEL, VERSION, ANATOMIES, parseRequest, type EyeRequest, type EyeOptions, type EyeResult, type EyePhoto, type LashTrace, type EyeFeature, type Anatomy, type Point } from "./contracts.js";
export { renderEyes } from "./engine.js";
export { frames, nativePlacement } from "./geometry.js";
export { extensionMap, chooseStyle } from "./lashes.js";
export { colourRecommendations } from "./liner.js";
export { lashMapSvg, lashMapCsv, mapDocument } from "./maps.js";
export { traceSummary, resampleTrace, photometricTraceEvidence } from "./observations.js";

export { recolourVisible } from "./visible-iris.js";
export type { IrisMasks, IrisStates, VisibleIrisResult } from "./visible-iris.js";
export {
  DEFAULT_LOCK_LEVEL, SIMULATION_LABEL, IrisTrialEngine,
  PixelLimitGuard, checkedLevel, legacyStrength, safeTrialReport,
} from "./iris-trial.js";
export type {
  IdentityDecision, IdentityGuard, IrisObservation, IrisTrialResult,
  ObservationSource, PrimaryBox, TrialPhoto,
} from "./iris-trial.js";
export { auditIrisTrial, aggregateIrisAudits, safeIrisAuditReport } from "./iris-evidence.js";
export type { IrisAudit, IrisAuditCounts } from "./iris-evidence.js";
export { irisToneQuality, measuredGateRow, safeIrisToneReport } from "./iris-quality.js";
export type { IrisToneMetrics, IrisToneReport } from "./iris-quality.js";
