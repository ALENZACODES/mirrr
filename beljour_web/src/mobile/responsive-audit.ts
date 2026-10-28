/** Observe this viewport and visible controls without changing device settings.
 * No screenshots, photographs, device identifiers, telemetry or guessed zoom state.
 */
export interface ResponsiveAuditResult {
  readonly viewportWidth: number | null;
  readonly contentWidth: number | null;
  readonly controlsSeen: number;
  readonly smallTouchControls: number;
  readonly smallTextElements: number;
  readonly overflowPixels: number | null;
  readonly sampled: boolean;
  readonly label: "measurement-not-certification";
  readonly warnings: readonly string[];
}

export interface ResponsiveStyle {
  readonly display?: string;
  readonly visibility?: string;
  readonly fontSize?: string;
}

export interface ResponsiveAuditOptions {
  readonly viewportWidth?: number;
  readonly contentWidth?: number;
  readonly style?: (node: Element) => ResponsiveStyle | null;
  readonly maxNodes?: number;
}

function rounded(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || value > 100000) return null;
  return Math.round(value);
}

function isControl(element: Element): boolean {
  const tag = element.tagName.toUpperCase();
  return ["A", "BUTTON", "SELECT", "TEXTAREA", "INPUT", "SUMMARY"].includes(tag)
    || ["button", "link"].includes(element.getAttribute("role") ?? "");
}

function visible(element: Element, style: ResponsiveStyle | null | undefined): boolean {
  return !(element as HTMLElement).hidden && element.getAttribute("aria-hidden") !== "true"
    && element.getAttribute("hidden") === null && style?.display !== "none" && style?.visibility !== "hidden";
}

function fontSize(style: ResponsiveStyle | null | undefined): number | null {
  if (!style?.fontSize) return null;
  const match = /^(\d+(?:\.\d+)?)px$/.exec(style.fontSize.trim());
  return match ? Number(match[1]) : null;
}

/** Records aggregate layout measurements, not a visual-regression pass. */
export function inspectResponsiveLayout(root: Element, options: ResponsiveAuditOptions = {}): ResponsiveAuditResult {
  if (!root || typeof root.tagName !== "string") throw new TypeError("A real page element is required");
  const max = options.maxNodes ?? 2500;
  if (!Number.isInteger(max) || max < 1 || max > 5000) throw new RangeError("Invalid scan bound");
  let seen = 0;
  let smallTouch = 0;
  let smallText = 0;
  let inspected = 0;
  const stack: Element[] = [root];
  while (stack.length && inspected < max) {
    const element = stack.pop();
    if (!element) break;
    const style = options.style?.(element);
    if (!visible(element, style)) continue;
    inspected += 1;
    if (isControl(element) && !(element as HTMLButtonElement).disabled) {
      const box = (element as HTMLElement).getBoundingClientRect?.();
      if (box && box.width > 0 && box.height > 0) {
        seen += 1;
        if (box.width < 44 || box.height < 44) smallTouch += 1;
      }
    }
    const size = fontSize(style);
    if (size !== null && size < 12 && element.children.length === 0 && Boolean(element.textContent?.trim())) {
      smallText += 1;
    }
    for (const child of Array.from(element.children).reverse()) {
      if (child && typeof (child as Element).getAttribute === "function") stack.push(child);
    }
  }
  const viewportWidth = rounded(options.viewportWidth);
  const contentWidth = rounded(options.contentWidth);
  const overflowPixels = viewportWidth !== null && contentWidth !== null
    ? Math.max(0, contentWidth - viewportWidth) : null;
  const warnings: string[] = [];
  if (overflowPixels === null) warnings.push("Viewport overflow was not measurable.");
  else if (overflowPixels > 1) warnings.push("The inspected layout exceeds the viewport.");
  if (smallTouch) warnings.push("Some measured controls are under the 44px project target.");
  if (smallText) warnings.push("Some visible text is below the 12px functional minimum.");
  if (stack.length) warnings.push("The bounded scan did not inspect every visible element.");
  warnings.push("Test 320px/390px, zoom and landscape physically; this scan cannot emulate them.");
  return {
    viewportWidth,
    contentWidth,
    controlsSeen: seen,
    smallTouchControls: smallTouch,
    smallTextElements: smallText,
    overflowPixels,
    sampled: stack.length > 0,
    label: "measurement-not-certification",
    warnings,
  };
}
