/** Distinct Home hash route so timing needs no copied HTML or shared build edit. */
import { mountTimingPage, type TimingPage } from "./timing-page.js";

export interface TimingEntry {
  readonly active: () => boolean;
  destroy(): void;
}

export function mountTimingEntry(doc: Document = document, browser: Window = window): TimingEntry {
  const host = doc.getElementById("lg-timing-root");
  if (!host) return { active: () => false, destroy: () => undefined };
  let page: TimingPage | null = null;
  let destroyed = false;
  const container = host;
  function close(): void {
    page?.close();
    page = null;
    container.hidden = true;
    delete doc.body.dataset.timingActive;
  }
  function sync(): void {
    if (destroyed) return;
    if (browser.location.hash !== "#timing") {
      close();
      return;
    }
    if (page) return;
    container.hidden = false;
    doc.body.dataset.timingActive = "true";
    page = mountTimingPage(doc, container, browser);
  }
  const onChange: EventListener = () => sync();
  const onHide: EventListener = () => close();
  browser.addEventListener("hashchange", onChange);
  browser.addEventListener("pagehide", onHide);
  sync();
  return {
    active: () => page !== null,
    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      browser.removeEventListener("hashchange", onChange);
      browser.removeEventListener("pagehide", onHide);
      close();
    },
  };
}
