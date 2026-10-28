/** Opt-in Home hash route. Existing tools and classic navigation remain unchanged. */
import { mountJudgeMode, type JudgeMode } from "./judge-mode.js";
import { mountContinuousDemo, type ContinuousDemo } from "./continuous/mount.js";
import { mountReleaseWorkspace, type ReleaseWorkspace } from "./release/mount.js";

export interface JudgeEntry {
  readonly active: () => boolean;
  destroy(): void;
}

export function mountJudgeEntry(doc: Document = document, browser: Window = window): JudgeEntry {
  const target = doc.getElementById("lg-judge-root");
  if (!target) return { active: () => false, destroy: () => undefined };
  let mode: JudgeMode | ContinuousDemo | ReleaseWorkspace | null = null;
  let activeRoute: "judge" | "full" | "verify" | null = null;
  let destroyed = false;
  const host = target;

  function close(): void {
    mode?.dispose();
    mode = null;
    activeRoute = null;
    host.hidden = true;
    delete doc.body.dataset.judgeActive;
  }

  function sync(): void {
    if (destroyed) return;
    const route = browser.location.hash === "#judge-full" ? "full"
      : browser.location.hash === "#judge" ? "judge"
        : browser.location.hash === "#judge-verify" ? "verify" : null;
    if (!route) {
      close();
      return;
    }
    if (mode && activeRoute === route) return;
    close();
    host.hidden = false;
    doc.body.dataset.judgeActive = "true";
    activeRoute = route;
    const exit = (): void => {
      const destination = activeRoute === "verify" ? "lg-verify-launch" : "lg-judge-launch";
      close();
      browser.location.hash = "#home";
      doc.getElementById(destination)?.focus();
    };
    mode = route === "verify" ? mountReleaseWorkspace(doc, host, exit)
      : route === "full" ? mountContinuousDemo(doc, host, exit)
        : mountJudgeMode(doc, host, exit);
  }

  const onHash: EventListener = (): void => sync();
  const onHide: EventListener = (): void => close();
  const onShow = (event: PageTransitionEvent): void => {
    if (event.persisted) sync();
  };
  browser.addEventListener("hashchange", onHash);
  browser.addEventListener("pagehide", onHide);
  browser.addEventListener("pageshow", onShow);
  sync();
  return {
    active: () => mode !== null,
    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      browser.removeEventListener("hashchange", onHash);
      browser.removeEventListener("pagehide", onHide);
      browser.removeEventListener("pageshow", onShow);
      close();
    },
  };
}
