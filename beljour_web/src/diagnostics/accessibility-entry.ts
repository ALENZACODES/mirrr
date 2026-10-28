/** Home hash route for opt-in keyboard and device review. */
import { mountAccessibilityPage, type AccessibilityPage } from "./accessibility-page.js";

export interface AccessibilityEntry {
  readonly active: () => boolean;
  destroy(): void;
}

export function mountAccessibilityEntry(
  doc: Document = document,
  browser: Window = window,
): AccessibilityEntry {
  const host = doc.getElementById("lg-accessibility-root");
  if (!host) return { active: () => false, destroy: () => undefined };
  const container = host;
  let page: AccessibilityPage | null = null;
  let disposed = false;

  function close(): void {
    page?.close();
    page = null;
    container.hidden = true;
    delete doc.body.dataset.accessibilityActive;
  }

  function sync(): void {
    if (disposed) return;
    if (browser.location.hash !== "#accessibility") {
      close();
      return;
    }
    if (page) return;
    container.hidden = false;
    doc.body.dataset.accessibilityActive = "true";
    page = mountAccessibilityPage(doc, container, browser);
  }

  const onHash: EventListener = () => sync();
  const onHide: EventListener = () => close();
  browser.addEventListener("hashchange", onHash);
  browser.addEventListener("pagehide", onHide);
  sync();
  return {
    active: () => page !== null,
    destroy(): void {
      if (disposed) return;
      disposed = true;
      browser.removeEventListener("hashchange", onHash);
      browser.removeEventListener("pagehide", onHide);
      close();
    },
  };
}
