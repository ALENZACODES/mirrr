/** Installs a passive browser prompt listener, never a service worker until clicked. */
import { createInstallController, installationBrowserPort } from "./install-controller.js";
import { mountInstallPage, type InstallPanel } from "./install-page.js";

export interface InstallEntry {
  readonly active: () => boolean;
  destroy(): void;
}

export function mountInstallEntry(doc: Document = document, browser: Window = window): InstallEntry {
  const host = doc.getElementById("lg-install-root");
  if (!host) return { active: () => false, destroy: () => undefined };
  const container = host;
  const controller = createInstallController(installationBrowserPort(browser));
  let page: InstallPanel | null = null;
  let disposed = false;

  function close(): void {
    page?.destroy();
    page = null;
    container.hidden = true;
    delete doc.body.dataset.installActive;
  }

  function sync(): void {
    if (disposed) return;
    if (browser.location.hash !== "#install") {
      close();
      return;
    }
    if (page) return;
    container.hidden = false;
    doc.body.dataset.installActive = "true";
    page = mountInstallPage(doc, container, controller);
  }

  const onHash: EventListener = (): void => sync();
  const onHide: EventListener = (): void => close();
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
      controller.dispose();
    },
  };
}
