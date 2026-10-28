/** Keyboard navigation for the top-level links of the client bar.
 * Does not intercept keystrokes intended for the editor or form controls.
 */
export type NavigationKey = "ArrowLeft" | "ArrowRight" | "Home" | "End";

export function navigationIndex(count: number, index: number, key: string): number | null {
  if (!Number.isInteger(count) || count <= 0) return null;
  if (!Number.isInteger(index) || index < 0 || index >= count) return null;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  if (key === "ArrowRight") return (index + 1) % count;
  if (key === "ArrowLeft") return (index - 1 + count) % count;
  return null;
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== "object") return false;
  const element = target as HTMLElement;
  const tag = element.tagName?.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || element.isContentEditable === true;
}

/** Called only from the nav container. Studio shortcuts keep their own key map. */
export function moveNavFocus(
  event: Pick<KeyboardEvent, "key" | "target" | "altKey" | "ctrlKey" | "metaKey" | "preventDefault">,
  items: readonly HTMLElement[],
): boolean {
  if (event.altKey || event.ctrlKey || event.metaKey || isTypingTarget(event.target)) return false;
  const index = items.findIndex((item) => item === event.target);
  const next = navigationIndex(items.length, index, event.key);
  if (next === null) return false;
  event.preventDefault();
  items[next].focus();
  return true;
}
