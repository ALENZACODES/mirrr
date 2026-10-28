/** Keyboard and accessibility behaviour confined to the live walkthrough mount. */
export interface JudgeKeyboardActions {
  exit(): void;
  toggleHelp(): void;
}

export interface JudgeKeyboardEvent {
  readonly key: string;
  readonly altKey?: boolean;
  readonly ctrlKey?: boolean;
  readonly metaKey?: boolean;
  readonly defaultPrevented?: boolean;
  readonly target?: EventTarget | null;
  preventDefault(): void;
}

export interface JudgeKeyTarget {
  addEventListener(type: "keydown", listener: EventListener): void;
  removeEventListener(type: "keydown", listener: EventListener): void;
}

export function isEditableJudgeTarget(target: EventTarget | null | undefined): boolean {
  if (!target || typeof target !== "object") return false;
  const node = target as HTMLElement;
  if (node.isContentEditable) return true;
  const tag = typeof node.tagName === "string" ? node.tagName.toUpperCase() : "";
  return tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA";
}

export type JudgeShortcut = "exit" | "help" | null;

/** No plain arrow/Enter/Space overrides: sliders and screen readers keep native controls. */
export function judgeShortcut(event: JudgeKeyboardEvent): JudgeShortcut {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return null;
  if (isEditableJudgeTarget(event.target)) return null;
  if (event.key === "Escape") return "exit";
  if (event.key === "?" || event.key === "F1") return "help";
  return null;
}

export function attachJudgeKeys(target: JudgeKeyTarget, actions: JudgeKeyboardActions): () => void {
  const onKeyDown: EventListener = (raw): void => {
    const event = raw as KeyboardEvent;
    const action = judgeShortcut(event);
    if (!action) return;
    event.preventDefault();
    if (action === "exit") actions.exit();
    else actions.toggleHelp();
  };
  target.addEventListener("keydown", onKeyDown);
  return () => target.removeEventListener("keydown", onKeyDown);
}

/** Update an existing focusable heading without touching the editor or other page landmarks. */
export function focusJudgeHeading(host: HTMLElement): boolean {
  const heading = host.querySelector<HTMLElement>("#lg-judge-title");
  if (!heading) return false;
  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
  return true;
}

export function announceJudgeStep(
  live: HTMLElement,
  stepNumber: number,
  total: number,
  title: string,
): void {
  if (!Number.isInteger(stepNumber) || !Number.isInteger(total)
    || total < 1 || stepNumber < 1 || stepNumber > total) {
    throw new RangeError("Invalid step announcement");
  }
  live.setAttribute("role", "status");
  live.setAttribute("aria-live", "polite");
  live.setAttribute("aria-atomic", "true");
  live.textContent = `Step ${stepNumber} of ${total}: ${title}`;
}

export function prepareJudgeRegion(host: HTMLElement, labelId: string): void {
  if (!labelId || !/^[a-z][\w-]*$/i.test(labelId)) throw new RangeError("Invalid label id");
  host.setAttribute("role", "region");
  host.setAttribute("aria-labelledby", labelId);
  host.setAttribute("aria-roledescription", "guided illustration");
}
