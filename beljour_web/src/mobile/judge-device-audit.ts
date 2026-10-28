/** Local browser capability audit. It never certifies an untested physical device. */
export type JudgeCapabilityResult = "available" | "unavailable" | "unknown";
export type JudgeCapability = "canvas" | "local-upload" | "bitmap-decode" | "local-export" | "viewport";

export interface JudgeDeviceRow {
  readonly id: JudgeCapability;
  readonly label: string;
  readonly result: JudgeCapabilityResult;
  readonly detail: string;
}

export interface JudgeDeviceSummary {
  readonly rows: readonly JudgeDeviceRow[];
  readonly viewportWidth: number | null;
  readonly reducedMotion: boolean | null;
  readonly allVerified: false;
  readonly disclaimer: string;
}

export interface JudgeBrowserProbe {
  readonly innerWidth?: number;
  readonly createImageBitmap?: unknown;
  readonly URL?: { readonly createObjectURL?: unknown; readonly revokeObjectURL?: unknown };
  matchMedia?(query: string): { readonly matches: boolean };
}

export interface JudgeDocumentProbe {
  createElement(tag: "canvas" | "input"): HTMLElement;
}

function featureFromCall(check: () => boolean): JudgeCapabilityResult {
  try {
    return check() ? "available" : "unavailable";
  } catch {
    return "unknown";
  }
}

export function safeJudgeViewportWidth(width: unknown): number | null {
  if (typeof width !== "number" || !Number.isFinite(width) || width < 1) return null;
  return Math.round(Math.min(100000, width));
}

export function judgeMotionPreference(browser: JudgeBrowserProbe | null): boolean | null {
  if (!browser?.matchMedia) return null;
  try {
    return Boolean(browser.matchMedia("(prefers-reduced-motion: reduce)").matches);
  } catch {
    return null;
  }
}

/** Strictly checks feature presence, not GPU speed, API credit balance or photo safety. */
export function judgeDeviceAudit(
  doc: JudgeDocumentProbe,
  browser: JudgeBrowserProbe | null,
): JudgeDeviceSummary {
  const width = safeJudgeViewportWidth(browser?.innerWidth);
  const canvas = featureFromCall(() => {
    const element = doc.createElement("canvas") as HTMLCanvasElement;
    return typeof element.getContext === "function" && element.getContext("2d") !== null;
  });
  const input = featureFromCall(() => {
    const element = doc.createElement("input") as HTMLInputElement;
    element.type = "file";
    return element.type === "file";
  });
  const bitmap = browser == null || browser.createImageBitmap === undefined
    ? "unknown"
    : typeof browser.createImageBitmap === "function" ? "available" : "unavailable";
  const download = featureFromCall(() => {
    return typeof browser?.URL?.createObjectURL === "function"
      && typeof browser?.URL?.revokeObjectURL === "function";
  });
  const viewport: JudgeCapabilityResult = width === null
    ? "unknown"
    : width >= 320 ? "available" : "unavailable";
  const rows: JudgeDeviceRow[] = [
    {
      id: "canvas",
      label: "2D Canvas drawing",
      result: canvas,
      detail: "Needed to preview the synthetic illustration. Performance is not tested.",
    },
    {
      id: "local-upload",
      label: "Local image picker",
      result: input,
      detail: "The file picker stays on this device. No camera permission is requested.",
    },
    {
      id: "bitmap-decode",
      label: "Image bitmap decoding",
      result: bitmap,
      detail: "Optional local-photo uploads may fail on browsers without decoding support.",
    },
    {
      id: "local-export",
      label: "Local blob download",
      result: download,
      detail: "Actual download success must still be checked by a person on this device.",
    },
    {
      id: "viewport",
      label: "Layout viewport",
      result: viewport,
      detail: width === null
        ? "Width cannot be measured in this environment."
        : `Reported width: ${width}px. This is not a responsive-layout certification.`,
    },
  ];
  return {
    rows,
    viewportWidth: width,
    reducedMotion: judgeMotionPreference(browser),
    allVerified: false,
    disclaimer: "Capability hints only; mobile speed, browser compatibility and accessibility need device testing.",
  };
}

export function judgeDeviceSummaryText(summary: JudgeDeviceSummary): string {
  const available = summary.rows.filter((row) => row.result === "available").length;
  const unavailable = summary.rows.filter((row) => row.result === "unavailable").length;
  const unknown = summary.rows.filter((row) => row.result === "unknown").length;
  const motion = summary.reducedMotion === null
    ? "Motion preference unknown"
    : summary.reducedMotion ? "Reduced motion requested" : "No reduced-motion request detected";
  return `${available} available, ${unavailable} unavailable, ${unknown} unknown. ${motion}. ${summary.disclaimer}`;
}
