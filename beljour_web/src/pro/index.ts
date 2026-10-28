/** Only supported entry point for the local professional editing module. */
export { ASPECT_RATIOS, checkCrop, checkRecipe, defaultCurves, defaultRecipe, ProInputError,
  requireDimensions, requireFinite } from "./types.js";
export type { Aspect, Channel, CropEdit, CurvePoint, ExportResult, PixelSource, PresetName,
  ProRecipe, ToneCurve, ToneCurves } from "./types.js";
export { applyCurvePixels, curveLut, curveValue, makeCurveLuts, threePointCurve,
  validateCurve } from "./curves.js";
export type { CurveLuts } from "./curves.js";
export { insideCrop, inversePixel, makeCropGeometry, previewGeometry } from "./crop.js";
export type { CropGeometry, SourceRect } from "./crop.js";
export { EXPORT_PRESETS, planProExport, safeStem, simulationText } from "./presets.js";
export type { ExportPreset, PlannedExport } from "./presets.js";
export { CanvasProSurface, drawLabel, exportPhotoPro, previewPhoto,
  EXPORT_BUDGET_MS, PREVIEW_BUDGET_MS } from "./render.js";
export type { PreviewResult, RenderSurface, SurfaceFactory } from "./render.js";
export { cloneRecipe, emptyRecipe, parseRecipe, RECIPE_FORMAT, serializeRecipe } from "./recipe.js";
export { RecipeHistory } from "./history.js";
export type { HistoryState } from "./history.js";

export { blendMaskedPixels, cropMaskMapping, rasterMask, sourceMaskMapping, validateMasks } from "./masks.js";
export type { BrushMask, LinearMask, LocalMask, MaskMapping, MaskMode, MaskPoint, RadialMask } from "./masks.js";
export { drawSplitView, planSplitView } from "./split.js";
export type { SplitAxis, SplitView } from "./split.js";

export { GpuProSurface, ProGpuError, ProGpuPass, packedCurveTable } from "./gpu.js";
export type { GpuPassStats } from "./gpu.js";
export { PRO_FRAGMENT_SHADER, PRO_VERTEX_SHADER } from "./gpu-shaders.js";
export { projectSource } from "./source-projection.js";
export type { Pro2D } from "./source-projection.js";

export { measureProOnDevice, median, runSyntheticProProbe, syntheticProSource } from "./performance.js";
export type { ProTimingOptions, ProTimingResult } from "./performance.js";

export { DEFAULT_LEVEL, DEFAULT_LOCK_LEVEL, EFFECTS, MAX_LEVEL, MIN_LEVEL, StrengthLevels,
  fromLegacyAmount, legacyAmount, nudgeLevel, validateLevel } from "./strength.js";
export type { Effect, StrengthSnapshot } from "./strength.js";
export { DEFAULT_SIMILARITY, guardFacePixels } from "./identity.js";
export type { FaceGuardDecision, FaceIdentityGuard, GuardedPixels } from "./identity.js";
export { PhotoEditCache } from "./cache.js";
export type { CacheStats, ResourceKind } from "./cache.js";
export { MAX_ENCODED_BYTES, scrubEncodedBlob, stripImageMetadata, stripPngMetadata } from "./export-privacy.js";
export type { ImageMime } from "./export-privacy.js";

export { DRAG_MAX_EDGE, FULL_MAX_PIXELS, ProgressivePreview, planResolution } from "./interaction.js";
export type { PreviewJob, PreviewStage } from "./interaction.js";
