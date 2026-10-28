/** Named output sizes; limits prevent unexpected upscale or large allocations. */
import { ProInputError, requireDimensions, type PresetName, type ProRecipe } from "./types.js";
import { makeCropGeometry, type CropGeometry } from "./crop.js";

export interface ExportPreset {
  readonly id: PresetName;
  readonly label: string;
  readonly mime: "image/jpeg" | "image/png";
  readonly maxEdge: number;
  readonly quality: number;
  readonly extension: "jpg" | "png";
}

export const EXPORT_PRESETS: Readonly<Record<PresetName, ExportPreset>> = Object.freeze({
  original: { id: "original", label: "High quality · JPG", mime: "image/jpeg",
    maxEdge: 4800, quality: 0.92, extension: "jpg" },
  web: { id: "web", label: "Web · JPG", mime: "image/jpeg", maxEdge: 1600, quality: 0.86, extension: "jpg" },
  portrait: { id: "portrait", label: "Portrait · JPG", mime: "image/jpeg",
    maxEdge: 1350, quality: 0.9, extension: "jpg" },
  story: { id: "story", label: "Story · JPG", mime: "image/jpeg", maxEdge: 1920, quality: 0.9, extension: "jpg" },
  lossless: { id: "lossless", label: "Lossless · PNG", mime: "image/png", maxEdge: 4800, quality: 1, extension: "png" },
});

export interface PlannedExport {
  readonly preset: ExportPreset;
  readonly geometry: CropGeometry;
  readonly filename: string;
  readonly label: string | null;
}

export function safeStem(value: string): string {
  if (typeof value !== "string") throw new ProInputError("File name must be text");
  const stem = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^[-_]+|[-_]+$/g, "").slice(0, 48);
  return stem || "look";
}

export function simulationText(recipe: Pick<ProRecipe, "simulation" | "simulationLabel">): string | null {
  return recipe.simulation && recipe.simulationLabel ? "Simulation" : null;
}

export function planProExport(width: number, height: number, recipe: ProRecipe, fileStem: string): PlannedExport {
  requireDimensions(width, height);
  if (!Object.hasOwn(EXPORT_PRESETS, recipe.export)) {
    throw new ProInputError("Unknown export type");
  }
  const preset = EXPORT_PRESETS[recipe.export];
  const geometry = makeCropGeometry(width, height, recipe.crop, preset.maxEdge);
  return { preset, geometry, filename: `${safeStem(fileStem)}.${preset.extension}`, label: simulationText(recipe) };
}
