/** Judge Mode is a self-contained, local-only demonstration, not a styling provider. */
import type { JudgeDetails } from "./judge-five-edits.js";
export const JUDGE_STEPS = [
  { id: "source", title: "Choose a starting image", short: "Image", hint: "Use a drawn sample or a photo you select." },
  { id: "consent", title: "Choose what may run", short: "Consent",
    hint: "Approve each illustrative action separately." },
  { id: "hair", title: "Try a hair colour", short: "Hair", hint: "Apply a local decorative hair overlay." },
  { id: "face", title: "Try a face detail", short: "Face", hint: "Apply an illustrative face-colour overlay." },
  { id: "tryon", title: "Preview a mock try-on", short: "Mock", hint: "This demonstration never contacts YouCam." },
  { id: "compare", title: "Compare both views", short: "Compare",
    hint: "Slide between the starting and illustrated images." },
  { id: "export", title: "Save a labelled result", short: "Export",
    hint: "Choose a format and size; the label is burned in." },
  { id: "plans", title: "See the pricing example", short: "Plans", hint: "Demo only. No payment or trial is started." },
] as const;

export type JudgeStep = typeof JUDGE_STEPS[number]["id"];
export type JudgeAction = "local" | "hair" | "face" | "mock";
export type JudgeSourceKind = "sample" | "upload";
export type JudgeHair = "none" | "chestnut" | "deep-blue";
export type JudgeFace = "none" | "warm" | "cool";
export type JudgeFormat = "image/png" | "image/jpeg";
export type JudgeSize = "standard" | "large";

export interface JudgePermissions {
  local: boolean;
  hair: boolean;
  face: boolean;
  mock: boolean;
}

export interface JudgeState {
  step: JudgeStep;
  source: JudgeSourceKind | null;
  permissions: JudgePermissions;
  hair: JudgeHair;
  face: JudgeFace;
  details: JudgeDetails;
  mock: boolean;
  comparison: number;
  format: JudgeFormat;
  size: JudgeSize;
  strength: number;
  complete: readonly JudgeStep[];
  skipped: readonly JudgeStep[];
}

export const SIMULATION_MARK = "SIMULATION — ILLUSTRATIVE DEMO";
export const MOCK_DISCLOSURE = "Mock YouCam try-on. No provider call or image upload occurs.";
export const LOCAL_DISCLOSURE = "Illustrative overlays run in this browser. They do not track facial features.";
export const SOURCE_LIMIT_BYTES = 10 * 1024 * 1024;
export const SOURCE_MAX_DIMENSION = 12_000;
export const OUTPUT_SIZES: Readonly<Record<JudgeSize, { width: number; height: number }>> = {
  standard: { width: 512, height: 640 },
  large: { width: 768, height: 960 },
};

export function judgeIndex(step: JudgeStep): number {
  return JUDGE_STEPS.findIndex((row) => row.id === step);
}

export function judgeStepAt(index: number): JudgeStep {
  if (!Number.isInteger(index) || index < 0 || index >= JUDGE_STEPS.length) {
    throw new RangeError("Unknown Judge Mode step");
  }
  return JUDGE_STEPS[index].id;
}

export function judgeFileName(format: JudgeFormat): string {
  return `beljour-illustrative-demo.${format === "image/png" ? "png" : "jpg"}`;
}

export function validateJudgeUpload(file: Pick<File, "size" | "type">): string | null {
  if (!Number.isFinite(file.size) || file.size <= 0 || file.size > SOURCE_LIMIT_BYTES) {
    return "Choose a photo smaller than 10 MB.";
  }
  if (file.type !== "image/jpeg" && file.type !== "image/png" && file.type !== "image/webp") {
    return "Choose a JPEG, PNG or WebP photo.";
  }
  return null;
}

export function validateJudgeDimensions(width: number, height: number): string | null {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 16 || height < 16) {
    return "The chosen photo is too small or unreadable.";
  }
  if (width > SOURCE_MAX_DIMENSION || height > SOURCE_MAX_DIMENSION) {
    return "The chosen photo is too large to preview safely.";
  }
  if (width * height > 80_000_000) return "The chosen photo is too large to preview safely.";
  return null;
}
