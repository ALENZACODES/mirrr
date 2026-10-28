/** An on-demand, bounded layout measurement for the current judge screen.
 * A synthetic DOM or desktop viewport is never called a physical device pass.
 */
import { inspectResponsiveLayout, type ResponsiveAuditResult } from "./responsive-audit.js";

export type JudgeDeviceWarning = "overflow" | "small-target" | "small-text" | "not-measurable" | "bounded-scan";

export interface JudgeDeviceSelfCheck {
  readonly viewport: number | null;
  readonly content: number | null;
  readonly interactiveControlsMeasured: number;
  readonly smallTargets: number;
  readonly smallText: number;
  readonly overflow: number | null;
  readonly warnings: readonly JudgeDeviceWarning[];
  readonly dataSent: 0;
  readonly screenshotsRecorded: 0;
  readonly verdict: "manual-review-required";
  readonly phoneCertified: false;
}

export interface JudgeDeviceSelfCheckOptions {
  readonly viewportWidth?: number;
  readonly contentWidth?: number;
  readonly maxNodes?: number;
  readonly style?: (node: Element) => {
    readonly display?: string;
    readonly visibility?: string;
    readonly fontSize?: string;
  } | null;
}

function warningCodes(report: ResponsiveAuditResult): readonly JudgeDeviceWarning[] {
  const warnings: JudgeDeviceWarning[] = [];
  if (report.overflowPixels === null) warnings.push("not-measurable");
  else if (report.overflowPixels > 1) warnings.push("overflow");
  if (report.smallTouchControls) warnings.push("small-target");
  if (report.smallTextElements) warnings.push("small-text");
  if (report.sampled) warnings.push("bounded-scan");
  return warnings;
}

/** Checks CSS boxes and computed font sizes only; reads no entered values. */
export function measureJudgeDevice(
  root: Element,
  options: JudgeDeviceSelfCheckOptions = {},
): JudgeDeviceSelfCheck {
  const report = inspectResponsiveLayout(root, {
    maxNodes: options.maxNodes ?? 1500,
    viewportWidth: options.viewportWidth,
    contentWidth: options.contentWidth,
    style: options.style,
  });
  return {
    viewport: report.viewportWidth,
    content: report.contentWidth,
    interactiveControlsMeasured: report.controlsSeen,
    smallTargets: report.smallTouchControls,
    smallText: report.smallTextElements,
    overflow: report.overflowPixels,
    warnings: warningCodes(report),
    dataSent: 0,
    screenshotsRecorded: 0,
    verdict: "manual-review-required",
    phoneCertified: false,
  };
}

export function measureJudgeCurrentScreen(doc: Document, root: Element): JudgeDeviceSelfCheck {
  const browser = doc.defaultView;
  const width = browser?.innerWidth;
  const content = doc.documentElement?.scrollWidth;
  return measureJudgeDevice(root, {
    viewportWidth: typeof width === "number" ? width : undefined,
    contentWidth: typeof content === "number" ? content : undefined,
    style: browser?.getComputedStyle
      ? (node) => {
        const computed = browser.getComputedStyle(node);
        return {
          display: computed.display,
          visibility: computed.visibility,
          fontSize: computed.fontSize,
        };
      }
      : undefined,
  });
}

export function describeJudgeDeviceCheck(report: JudgeDeviceSelfCheck): string {
  const width = report.viewport === null ? "Unknown" : `${report.viewport}px`;
  const overflow = report.overflow === null ? "not measured" : `${report.overflow}px`;
  return `Viewport ${width}; horizontal overflow ${overflow}; `
    + `${report.interactiveControlsMeasured} visible targets measured, `
    + `${report.smallTargets} below 44px and ${report.smallText} text items below 12px. `
    + "Review manually at 320px, 390px, landscape, 200% zoom and with a screen reader.";
}
