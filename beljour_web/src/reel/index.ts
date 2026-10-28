/** Public Lane E entry for local short-clip preset planning. */
export { CLIP_PRESETS, drawClipLabel, resolveClipPreset } from "./short-clips.js";
export type { ClipMime, ClipPlan, ClipPreset, ClipPresetId } from "./short-clips.js";
export { ClipJob, ClipJobError, createClipJob } from "./clip-jobs.js";
export type { ClipJobOptions, ClipJobState, ClipJobStatus } from "./clip-jobs.js";

export { ReelJobScope, ReelScopeError, withReelJobScope } from "./session.js";
export type { ReelAudioHandle, ReelDisposable, ReelScheduler, ReelScopeStats, ReelVideoHandle } from "./session.js";
export { ColourPass, ReelGpuError } from "./gl.js";
export type { ColourPassResources } from "./gl.js";

export { exportReelFrame, prepareEditedReelFrame } from "./frame-export.js";
export type { FrameExportSettings, FrameSource, ReelFrameResult } from "./frame-export.js";
