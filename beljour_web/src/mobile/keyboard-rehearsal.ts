/** Explicit keyboard rehearsal on real page controls.
 * Records only accessibility booleans and counts, never characters or focus IDs.
 */
export interface KeyAuditStyle {
  readonly outlineStyle?: string;
  readonly outlineWidth?: string;
  readonly boxShadow?: string;
}

export interface KeyboardAuditHost {
  addEventListener(type: "focusin" | "keydown", listener: EventListener): void;
  removeEventListener(type: "focusin" | "keydown", listener: EventListener): void;
}

export interface KeyboardAuditResult {
  readonly recordedFocus: number;
  readonly tabRequests: number;
  readonly namedControls: number;
  readonly unnamedControls: number;
  readonly visibleRingHints: number;
  readonly ringUnknown: number;
  readonly notInTabOrder: number;
  readonly active: boolean;
  readonly proof: "manual-hint-only";
}

export interface KeyboardAuditOptions {
  readonly getStyle?: (node: Element) => KeyAuditStyle | null;
  readonly referenceExists?: (id: string) => boolean;
}

function hasName(element: Element, referenceExists?: KeyboardAuditOptions["referenceExists"]): boolean {
  const explicit = element.getAttribute("aria-label")?.trim();
  if (explicit) return true;
  const referenced = element.getAttribute("aria-labelledby")?.split(/\s+/).filter(Boolean) ?? [];
  if (referenced.length && referenced.every((id) => referenceExists?.(id) ?? false)) return true;
  const title = element.getAttribute("title")?.trim();
  if (title) return true;
  const tag = element.tagName.toUpperCase();
  if (tag === "A" || tag === "BUTTON" || tag === "SUMMARY") {
    return Boolean(element.textContent?.trim());
  }
  if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") {
    const typed = element as HTMLInputElement;
    return Boolean(typed.labels && typed.labels.length > 0)
      || element.parentElement?.tagName.toUpperCase() === "LABEL";
  }
  return false;
}

function outlineHint(style: KeyAuditStyle | null | undefined): "visible" | "unknown" {
  if (!style) return "unknown";
  const width = Number.parseFloat(style.outlineWidth ?? "");
  const outline = style.outlineStyle && style.outlineStyle !== "none" && width >= 2;
  const shadow = style.boxShadow && style.boxShadow !== "none";
  return outline || shadow ? "visible" : "unknown";
}

export class KeyboardRehearsal {
  private total = 0;
  private tabs = 0;
  private named = 0;
  private unnamed = 0;
  private rings = 0;
  private unknown = 0;
  private outsideOrder = 0;
  private active = false;
  private readonly focusListener: EventListener;
  private readonly keyListener: EventListener;

  constructor(private readonly host: KeyboardAuditHost, private readonly options: KeyboardAuditOptions = {}) {
    this.focusListener = (event): void => {
      if (!this.active || this.total >= 250) return;
      const target = event.target;
      if (!target || typeof (target as Element).getAttribute !== "function") return;
      const element = target as Element;
      this.total += 1;
      if (hasName(element, this.options.referenceExists)) this.named += 1;
      else this.unnamed += 1;
      if (outlineHint(this.options.getStyle?.(element)) === "visible") this.rings += 1;
      else this.unknown += 1;
      if (element.getAttribute("tabindex") === "-1") this.outsideOrder += 1;
    };
    this.keyListener = (event): void => {
      if (!this.active || this.tabs >= 250) return;
      if ((event as KeyboardEvent).key === "Tab") this.tabs += 1;
      // No key code, pressed character, value or focused element is retained.
    };
  }

  start(): void {
    if (this.active) return;
    this.total = 0;
    this.tabs = 0;
    this.named = 0;
    this.unnamed = 0;
    this.rings = 0;
    this.unknown = 0;
    this.outsideOrder = 0;
    this.active = true;
    this.host.addEventListener("focusin", this.focusListener);
    this.host.addEventListener("keydown", this.keyListener);
  }

  stop(): KeyboardAuditResult {
    if (this.active) {
      this.host.removeEventListener("focusin", this.focusListener);
      this.host.removeEventListener("keydown", this.keyListener);
    }
    this.active = false;
    return this.snapshot;
  }

  get snapshot(): KeyboardAuditResult {
    return {
      recordedFocus: this.total,
      tabRequests: this.tabs,
      namedControls: this.named,
      unnamedControls: this.unnamed,
      visibleRingHints: this.rings,
      ringUnknown: this.unknown,
      notInTabOrder: this.outsideOrder,
      active: this.active,
      proof: "manual-hint-only",
    };
  }

  dispose(): void { this.stop(); }
}

export function keyboardEvidenceText(result: KeyboardAuditResult): string {
  return `${result.tabRequests} Tab requests, ${result.recordedFocus} focus events, `
    + `${result.unnamedControls} potentially unnamed controls. Focus ring visibility needs human review.`;
}
