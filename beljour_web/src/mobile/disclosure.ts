/** Two simple, non-modal disclosures: mobile menu and optional tools panel.
 * Focus stays in normal document order, rather than trapping the editor behind a dialog.
 */
import { moveNavFocus } from "./keyboard.js";
import { watchCompact, type WindowWithMedia } from "./viewport.js";

export interface DisclosureParts {
  readonly root: HTMLElement;
  readonly trigger: HTMLButtonElement;
  readonly panel: HTMLElement;
  readonly toolsButton: HTMLButtonElement;
  readonly toolsPanel: HTMLElement;
  readonly topLinks: readonly HTMLElement[];
}

export interface EventSurface {
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

export interface DisclosureHandle {
  readonly expanded: boolean;
  readonly toolsExpanded: boolean;
  open(): void;
  close(restoreFocus?: boolean): void;
  openTools(): void;
  closeTools(restoreFocus?: boolean): void;
  destroy(): void;
}

export function within(node: Node | null, ancestor: Node): boolean {
  let current: Node | null = node;
  while (current) {
    if (current === ancestor) return true;
    current = current.parentNode;
  }
  return false;
}

export function makeDisclosure(
  parts: DisclosureParts,
  doc: EventSurface,
  viewport: WindowWithMedia,
): DisclosureHandle {
  let compact = false;
  let expanded = false;
  let toolsExpanded = false;
  let disposed = false;

  const menu = (value: boolean): void => {
    expanded = value;
    parts.panel.dataset.open = value ? "true" : "false";
    parts.trigger.setAttribute("aria-expanded", String(value));
    parts.trigger.setAttribute("aria-label", value ? "Close navigation" : "Open navigation");
  };

  const tools = (value: boolean): void => {
    toolsExpanded = value;
    parts.toolsPanel.dataset.open = value ? "true" : "false";
    parts.toolsButton.setAttribute("aria-expanded", String(value));
  };

  const open = (): void => {
    if (disposed) return;
    menu(true);
    const first = parts.topLinks[0];
    first?.focus();
  };

  const closeTools = (restoreFocus = false): void => {
    if (!toolsExpanded) return;
    tools(false);
    if (restoreFocus) parts.toolsButton.focus();
  };

  const close = (restoreFocus = false): void => {
    if (disposed) return;
    closeTools();
    if (!expanded) return;
    menu(false);
    if (restoreFocus && compact) parts.trigger.focus();
  };

  const openTools = (): void => {
    if (disposed) return;
    if (compact && !expanded) menu(true);
    tools(true);
    parts.toolsPanel.querySelector<HTMLElement>("a")?.focus();
  };

  const toggleMenu: EventListener = (): void => {
    if (expanded) close(true);
    else open();
  };

  const toggleTools: EventListener = (): void => {
    if (toolsExpanded) closeTools(true);
    else openTools();
  };

  const keys: EventListener = (raw: Event): void => {
    const event = raw as KeyboardEvent;
    if (event.key === "Escape") {
      if (toolsExpanded) {
        closeTools(true);
        event.preventDefault();
      } else if (expanded) {
        close(true);
        event.preventDefault();
      }
      return;
    }
    if (within(event.target as Node | null, parts.panel)) {
      moveNavFocus(event, parts.topLinks);
    }
  };

  const outside: EventListener = (event: Event): void => {
    if (!within(event.target as Node | null, parts.root)) {
      close();
    }
  };

  const followed: EventListener = (event: Event): void => {
    const target = event.target as Node | null;
    let current = target;
    while (current && current !== parts.panel) {
      if (current instanceof Element && current.tagName === "A") {
        close();
        return;
      }
      current = current.parentNode;
    }
  };

  parts.trigger.addEventListener("click", toggleMenu);
  parts.toolsButton.addEventListener("click", toggleTools);
  parts.panel.addEventListener("click", followed);
  doc.addEventListener("keydown", keys);
  doc.addEventListener("pointerdown", outside);
  const stopViewport = watchCompact(viewport, (nowCompact) => {
    compact = nowCompact;
    menu(false);
    tools(false);
  });
  menu(false);
  tools(false);

  return {
    get expanded() { return expanded; },
    get toolsExpanded() { return toolsExpanded; },
    open,
    close,
    openTools,
    closeTools,
    destroy(): void {
      if (disposed) return;
      close();
      disposed = true;
      stopViewport();
      parts.trigger.removeEventListener("click", toggleMenu);
      parts.toolsButton.removeEventListener("click", toggleTools);
      parts.panel.removeEventListener("click", followed);
      doc.removeEventListener("keydown", keys);
      doc.removeEventListener("pointerdown", outside);
    },
  };
}
