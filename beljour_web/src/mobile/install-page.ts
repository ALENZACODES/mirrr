/** On-demand browser installation and public-shell cache panel. No billing or private data. */
import type { InstallController } from "./install-controller.js";
import type { InstallSnapshot } from "./install-state.js";
import type { PublicShellStorage } from "./install-storage.js";

export interface InstallPanel {
  readonly root: HTMLElement;
  destroy(): void;
}

function node<K extends keyof HTMLElementTagNameMap>(doc: Document, tag: K, text = ""):
  HTMLElementTagNameMap[K] {
  const created = doc.createElement(tag);
  created.textContent = text;
  return created;
}

function offlineText(snapshot: InstallSnapshot): string {
  switch (snapshot.offline) {
    case "unsupported": return "Offline shell is unavailable in this browser or insecure context.";
    case "available": return "Offline shell is optional and has not been requested in this visit.";
    case "enabling": return "Registering the reviewed, public-only service worker…";
    case "ready": return "Shell registration accepted. Test the cached pages offline before relying on them.";
    case "error": return "Offline registration did not complete. Local editing remains available.";
  }
}

function installText(snapshot: InstallSnapshot): string {
  switch (snapshot.install) {
    case "unsupported": return "Browser installation needs a secure context and platform support.";
    case "browser-menu": return "If supported, use your browser's Install or Add to Home Screen menu.";
    case "prompt-ready": return "Your browser offered an install prompt. Installation requires your click.";
    case "asking": return "Waiting for your browser's installation decision.";
    case "accepted": return "You accepted the prompt. Confirm installation in your browser; this is not proof of success.";
    case "dismissed": return "Install was dismissed. You can still use the browser version.";
    case "installed": return "Browser reported installation; editing features still need device testing.";
  }
}

export function mountInstallPage(doc: Document, host: HTMLElement, controller: InstallController): InstallPanel {
  let disposed = false;
  const root = node(doc, "section");
  root.className = "lg-install-panel";
  root.setAttribute("aria-label", "Private install and offline controls");
  const title = node(doc, "h2", "Install and offline pages");
  title.id = "lg-install-heading";
  title.tabIndex = -1;
  const intro = node(doc, "p",
    "Optional browser installation. Only reviewed public shell assets are cached. No photo or recipe is cached here.");
  const limits = node(doc, "p",
    "Online YouCam services need a connection and explicit consent. Cached pages do not prove offline editing.");
  const offlineButton = node(doc, "button", "Enable public offline shell");
  offlineButton.type = "button";
  offlineButton.id = "lg-install-offline";
  const offlineStatus = node(doc, "p");
  offlineStatus.id = "lg-install-offline-status";
  const promptButton = node(doc, "button", "Use browser install prompt");
  promptButton.type = "button";
  promptButton.id = "lg-install-prompt";
  const promptStatus = node(doc, "p");
  const storageButton = node(doc, "button", "Inspect public-shell storage");
  storageButton.type = "button";
  const storageStatus = node(doc, "p", "No storage check was requested.");
  storageStatus.id = "lg-install-storage";
  const clearConfirm = node(doc, "input");
  clearConfirm.type = "checkbox";
  clearConfirm.id = "lg-install-clear-confirm";
  const clearLabel = node(doc, "label", "Clear this app's cached public files (not photos or settings)");
  clearLabel.htmlFor = clearConfirm.id;
  const clearButton = node(doc, "button", "Clear public-shell cache");
  clearButton.type = "button";
  clearButton.id = "lg-install-clear";
  clearButton.disabled = true;
  const updateConfirm = node(doc, "input");
  updateConfirm.type = "checkbox";
  updateConfirm.id = "lg-install-saved-confirm";
  const updateLabel = node(doc, "label", "I saved or exported edits in all open tabs");
  updateLabel.htmlFor = updateConfirm.id;
  const updateButton = node(doc, "button", "Allow waiting update");
  updateButton.type = "button";
  updateButton.id = "lg-install-update";
  const updateStatus = node(doc, "p");
  const feedback = node(doc, "p", "No install, cache or update action has run.");
  feedback.id = "lg-install-feedback";
  feedback.setAttribute("role", "status");
  feedback.setAttribute("aria-live", "polite");
  const back = node(doc, "a", "Return to Home");
  back.href = "#home";
  const actions = node(doc, "div");
  actions.className = "lg-install-controls";
  actions.append(offlineButton, promptButton, storageButton);
  const clearBox = node(doc, "div");
  clearBox.className = "lg-install-confirm";
  clearBox.append(clearConfirm, clearLabel, clearButton);
  const updateBox = node(doc, "div");
  updateBox.className = "lg-install-confirm";
  updateBox.append(updateConfirm, updateLabel, updateButton);
  root.append(title, intro, limits, actions, offlineStatus, promptStatus, storageStatus, clearBox,
    updateBox, updateStatus, feedback, back);
  host.replaceChildren(root);
  title.focus({ preventScroll: true });

  function render(state: InstallSnapshot): void {
    if (disposed) return;
    offlineStatus.textContent = offlineText(state);
    promptStatus.textContent = installText(state);
    offlineButton.disabled = state.offline === "unsupported" || state.offline === "enabling";
    promptButton.disabled = state.install !== "prompt-ready";
    updateBox.hidden = !state.updateWaiting;
    updateStatus.textContent = state.updateWaiting
      ? "An update is waiting. It will not replace this editing session automatically."
      : "No waiting update has been confirmed.";
    updateButton.disabled = !state.updateWaiting || !state.updateAcknowledged;
  }

  const unsubscribe = controller.subscribe(render);
  let checking = false;
  async function inspect(): Promise<void> {
    if (disposed || checking) return;
    checking = true;
    storageButton.disabled = true;
    try {
      const result: PublicShellStorage = await controller.inspectStorage();
      if (disposed) return;
      storageStatus.textContent = `${result.cacheVersions} matching public-shell versions. ${result.message}`;
    } catch {
      if (!disposed) storageStatus.textContent = "Browser storage status is unavailable.";
    } finally {
      checking = false;
      if (!disposed) storageButton.disabled = false;
    }
  }

  const onEnable = (): void => {
    if (disposed) return;
    feedback.textContent = "Public cache registration requested. No personal data is sent.";
    void controller.enableOffline().then(() => {
      if (!disposed) {
        feedback.textContent = offlineText(controller.state.snapshot);
        void inspect();
      }
    });
  };
  const onInstall = (): void => {
    if (disposed) return;
    feedback.textContent = "Opening the browser's optional install prompt.";
    void controller.requestInstall().then(() => {
      if (!disposed) feedback.textContent = installText(controller.state.snapshot);
    });
  };
  const onStorage = (): void => { void inspect(); };
  const onClearChoice = (): void => { clearButton.disabled = !clearConfirm.checked; };
  const onClear = (): void => {
    if (disposed || !clearConfirm.checked) return;
    clearButton.disabled = true;
    void controller.clearCache().then((deleted) => {
      if (!disposed) {
        feedback.textContent = `${deleted} matching public-shell cache versions cleared.`;
        clearConfirm.checked = false;
        void inspect();
      }
    }).catch(() => {
      if (!disposed) feedback.textContent = "The browser refused cache cleanup. Nothing else was touched.";
    });
  };
  const onUpdateChoice = (): void => controller.confirmSavedWork(updateConfirm.checked);
  const onUpdate = (): void => {
    if (disposed || !updateConfirm.checked) return;
    feedback.textContent = controller.applyUpdate()
      ? "Waiting update was approved. This page will not reload itself."
      : "Update refused: there is no waiting worker or saved-work confirmation.";
    updateConfirm.checked = false;
  };

  offlineButton.addEventListener("click", onEnable);
  promptButton.addEventListener("click", onInstall);
  storageButton.addEventListener("click", onStorage);
  clearConfirm.addEventListener("change", onClearChoice);
  clearButton.addEventListener("click", onClear);
  updateConfirm.addEventListener("change", onUpdateChoice);
  updateButton.addEventListener("click", onUpdate);

  return {
    root,
    destroy(): void {
      if (disposed) return;
      disposed = true;
      unsubscribe();
      offlineButton.removeEventListener("click", onEnable);
      promptButton.removeEventListener("click", onInstall);
      storageButton.removeEventListener("click", onStorage);
      clearConfirm.removeEventListener("change", onClearChoice);
      clearButton.removeEventListener("click", onClear);
      updateConfirm.removeEventListener("change", onUpdateChoice);
      updateButton.removeEventListener("click", onUpdate);
      root.remove();
    },
  };
}
