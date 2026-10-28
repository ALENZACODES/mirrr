/** Scoped, modifier-safe keyboard commands for the guided client. Author: John Khan. */
import { ContinuousFocusSession } from "./focus-session.js";

export type KeyboardDecision = "help" | "exit" | null;

export interface KeyboardGesture {
  readonly key: string;
  readonly target?: EventTarget | null;
  readonly altKey?: boolean;
  readonly ctrlKey?: boolean;
  readonly shiftKey?: boolean;
  readonly metaKey?: boolean;
  readonly defaultPrevented?: boolean;
  preventDefault(): void;
}

export interface KeyboardTarget {
  addEventListener(type: "keydown", listener: EventListener): void;
  removeEventListener(type: "keydown", listener: EventListener): void;
}

export interface KeyboardCallbacks {
  readonly exit: () => void;
  readonly changed: () => void;
}

export function editableKeyboardTarget(target: EventTarget | null | undefined): boolean {
  if (!target || typeof target !== "object") return false;
  const node = target as HTMLElement;
  if (node.isContentEditable) return true;
  const name = typeof node.tagName === "string" ? node.tagName.toUpperCase() : "";
  return name === "INPUT" || name === "SELECT" || name === "TEXTAREA";
}

/** No printable or arrow-key shortcut may take over a native editor control. */
export function keyboardDecision(event: KeyboardGesture): KeyboardDecision {
  if (event.defaultPrevented || event.altKey || event.ctrlKey
    || event.shiftKey || event.metaKey) return null;
  if (editableKeyboardTarget(event.target)) return null;
  if (event.key === "F1") return "help";
  if (event.key === "Escape") return "exit";
  return null;
}

export class ContinuousKeyboardSession {
  private open = false;
  private disposed = false;
  private readonly target: KeyboardTarget;
  private readonly onKey: EventListener;
  private readonly callbacks: KeyboardCallbacks;
  private readonly focus: ContinuousFocusSession;

  constructor(target: KeyboardTarget, callbacks: KeyboardCallbacks,
    focus: ContinuousFocusSession) {
    this.target = target;
    this.callbacks = callbacks;
    this.focus = focus;
    this.onKey = (raw): void => {
      const event = raw as KeyboardEvent;
      const decision = keyboardDecision(event);
      if (!decision || this.disposed) return;
      event.preventDefault();
      if (decision === "help") {
        this.toggleHelp();
      } else if (this.open) {
        this.closeHelp();
      } else {
        this.callbacks.exit();
      }
    };
    target.addEventListener("keydown", this.onKey);
  }

  get helpOpen(): boolean {
    return this.open;
  }

  toggleHelp(): void {
    if (this.disposed) return;
    this.open = !this.open;
    this.focus.prefer("keyboard-help");
    this.callbacks.changed();
  }

  closeHelp(): void {
    if (!this.open || this.disposed) return;
    this.open = false;
    this.focus.prefer("keyboard-help");
    this.callbacks.changed();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.open = false;
    this.target.removeEventListener("keydown", this.onKey);
  }
}
