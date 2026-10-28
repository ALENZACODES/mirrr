/** Preserve keyboard focus through a client-only screen rebuild. Author: John Khan. */
export type FocusResult = "control" | "heading" | "none";

export interface FocusableNode {
  readonly tagName?: string;
  readonly parentNode?: FocusableNode | null;
  readonly dataset?: DOMStringMap;
  readonly disabled?: boolean;
  /** HTMLElement.hidden is `boolean | "until-found"`; either truthy form keeps a control out of focus. */
  readonly hidden?: boolean | "until-found";
  readonly isConnected?: boolean;
  readonly getAttribute?: (name: string) => string | null;
  focus?: (options?: FocusOptions) => void;
}

export interface FocusRoot {
  querySelectorAll(selector: string): NodeListOf<Element>;
}

export interface FocusDocument {
  readonly activeElement?: Element | null;
}

export interface CapturedControl {
  readonly action: string;
  readonly step: string;
}

const ACTION_RE = /^[a-z][a-z0-9/_-]{0,95}$/i;

/** A parent walk avoids applying selectors or interpreting content supplied by a user. */
export function descendantOf(node: FocusableNode | null, host: object): boolean {
  let current = node;
  for (let depth = 0; depth < 64; depth += 1) {
    if (!current) return false;
    if (current === host) return true;
    current = current.parentNode ?? null;
  }
  return false;
}

export function focusAction(node: FocusableNode | null): string | null {
  if (!node) return null;
  const tag = node.tagName?.toUpperCase() ?? "";
  if (tag !== "INPUT" && tag !== "BUTTON" && tag !== "SELECT"
    && tag !== "TEXTAREA") return null;
  if (node.disabled || node.hidden || node.getAttribute?.("aria-hidden") === "true") {
    return null;
  }
  const key = node.dataset?.tourAction;
  if (typeof key !== "string" || !ACTION_RE.test(key)) return null;
  return key;
}

function matchingControl(root: FocusRoot, action: string): FocusableNode | null {
  if (!ACTION_RE.test(action)) return null;
  for (const selector of ["button", "input", "select", "textarea"]) {
    for (const element of root.querySelectorAll(selector)) {
      const node = element as unknown as FocusableNode;
      if (focusAction(node) === action) return node;
    }
  }
  return null;
}

/** Only a fixed action key and step identifier are retained, never a field value. */
export class ContinuousFocusSession {
  private previous: CapturedControl | null = null;
  private preferred: string | null = null;
  private disposed = false;

  get snapshot(): CapturedControl | null {
    return this.previous ? { ...this.previous } : null;
  }

  capture(doc: FocusDocument, root: FocusRoot, step: string | null): void {
    if (this.disposed) return;
    this.previous = null;
    if (!step || !/^[a-z][a-z-]{0,63}$/.test(step)) return;
    const current = doc.activeElement as unknown as FocusableNode | null;
    if (!descendantOf(current, root)) return;
    const action = focusAction(current);
    if (action) this.previous = { action, step };
  }

  /** Keyboard help may request its own toggle to receive focus after replacement. */
  prefer(action: string): void {
    if (this.disposed) return;
    if (!ACTION_RE.test(action)) throw new RangeError("Invalid focus action");
    this.preferred = action;
  }

  restore(root: FocusRoot, step: string, heading: FocusableNode): FocusResult {
    if (this.disposed) return "none";
    const requested = this.preferred;
    this.preferred = null;
    const preserved = this.previous;
    this.previous = null;
    const action = requested ?? (preserved?.step === step ? preserved.action : null);
    if (action) {
      const target = matchingControl(root, action);
      if (target?.focus) {
        target.focus({ preventScroll: true });
        return "control";
      }
    }
    if (heading.focus) {
      heading.focus({ preventScroll: true });
      return "heading";
    }
    return "none";
  }

  dispose(): void {
    this.disposed = true;
    this.previous = null;
    this.preferred = null;
  }
}
