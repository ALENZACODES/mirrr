/** PWA lifecycle adapter: opt-in, no auto-update and no provider/photo access. */
import { InstallState, type InstallCapabilities, type InstallSnapshot } from "./install-state.js";
import {
  clearPublicShellStorage,
  inspectPublicShellStorage,
  type CacheStoreLike,
  type PublicShellStorage,
  type SiteStorageLike,
} from "./install-storage.js";

export interface InstallPromptEventLike {
  preventDefault(): void;
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface WorkerLike {
  readonly scriptURL?: string;
  readonly state?: string;
  postMessage(value: { type: "BELJOUR_ACTIVATE_AFTER_SAVE" }): void;
}

export interface RegistrationLike {
  readonly waiting?: WorkerLike | null;
  readonly installing?: WorkerLike | null;
  readonly active?: WorkerLike | null;
  addEventListener(type: "updatefound", listener: EventListener): void;
  removeEventListener(type: "updatefound", listener: EventListener): void;
}

export interface WorkerContainerLike {
  register(url: string, options: { scope: string }): Promise<RegistrationLike>;
  getRegistration(): Promise<RegistrationLike | undefined>;
  addEventListener(type: "controllerchange", listener: EventListener): void;
  removeEventListener(type: "controllerchange", listener: EventListener): void;
}

export interface InstallBrowserPort {
  readonly capabilities: InstallCapabilities;
  readonly workers: WorkerContainerLike | null;
  readonly caches: CacheStoreLike | null;
  readonly storage: SiteStorageLike | null;
  readonly onLine: () => boolean | null;
  addEventListener(type: "beforeinstallprompt" | "appinstalled", listener: EventListener): void;
  removeEventListener(type: "beforeinstallprompt" | "appinstalled", listener: EventListener): void;
}

export interface InstallController {
  readonly state: InstallState;
  readonly subscribe: (listener: (value: InstallSnapshot) => void) => () => void;
  enableOffline(): Promise<void>;
  requestInstall(): Promise<void>;
  inspectStorage(): Promise<PublicShellStorage>;
  clearCache(): Promise<number>;
  confirmSavedWork(confirmed: boolean): void;
  applyUpdate(): boolean;
  dispose(): void;
}

export function installationBrowserPort(browser: Window): InstallBrowserPort {
  const nav = browser.navigator;
  const standalone = browser.matchMedia?.("(display-mode: standalone)")?.matches === true;
  const secure = browser.isSecureContext === true;
  return {
    capabilities: {
      secure,
      worker: Boolean(nav.serviceWorker),
      standalone,
    },
    workers: nav.serviceWorker ?? null,
    caches: typeof browser.caches === "object" ? browser.caches : null,
    storage: nav.storage ?? null,
    onLine: () => typeof nav.onLine === "boolean" ? nav.onLine : null,
    addEventListener: (name, listener) => browser.addEventListener(name, listener),
    removeEventListener: (name, listener) => browser.removeEventListener(name, listener),
  };
}

/** No registration happens in the constructor. A visitor must press Enable. */
export function createInstallController(port: InstallBrowserPort): InstallController {
  const state = new InstallState(port.capabilities);
  let registered: RegistrationLike | null = null;
  let offered: InstallPromptEventLike | null = null;
  let disposed = false;

  const updateFound: EventListener = (): void => {
    // An installing worker is not ready to apply until waiting is confirmed.
    if (!disposed) state.setUpdateWaiting(isOurWorker(registered?.waiting));
  };
  const changed: EventListener = (): void => {
    if (!disposed) {
      state.appliedUpdate();
      void refreshRegistration();
    }
  };
  const offeredPrompt: EventListener = (event): void => {
    const candidate = event as unknown as InstallPromptEventLike;
    if (disposed || typeof candidate.prompt !== "function") return;
    candidate.preventDefault();
    offered = candidate;
    state.promptAvailable();
  };
  const installed: EventListener = (): void => {
    if (!disposed) state.installed();
    offered = null;
  };

  function isOurWorker(worker: WorkerLike | null | undefined): boolean {
    if (!worker?.scriptURL) return false;
    try {
      return new URL(worker.scriptURL).pathname === "/service-worker.js";
    } catch {
      return false;
    }
  }

  function observeRegistration(value: RegistrationLike | null): void {
    registered?.removeEventListener("updatefound", updateFound);
    registered = value;
    registered?.addEventListener("updatefound", updateFound);
    if (!disposed) state.setUpdateWaiting(isOurWorker(registered?.waiting));
  }

  async function refreshRegistration(): Promise<void> {
    if (!port.workers) return;
    try {
      const current = await port.workers.getRegistration();
      if (!disposed && current) observeRegistration(current);
    } catch {
      // Missing service-worker access is not an editor error.
    }
  }

  port.addEventListener("beforeinstallprompt", offeredPrompt);
  port.addEventListener("appinstalled", installed);
  port.workers?.addEventListener("controllerchange", changed);
  // Reading registration status is safe; it never installs or updates a worker.
  void refreshRegistration();

  return {
    state,
    subscribe: (listener) => state.subscribe(listener),
    async enableOffline(): Promise<void> {
      if (disposed || !port.capabilities.secure || !port.capabilities.worker || !port.workers) return;
      state.setOffline("enabling");
      try {
        const result = await port.workers.register("/service-worker.js", { scope: "/" });
        if (disposed) return;
        observeRegistration(result);
        state.setOffline("ready");
      } catch {
        if (!disposed) state.setOffline("error", "registration");
      }
    },
    async requestInstall(): Promise<void> {
      if (disposed || !offered || state.snapshot.install !== "prompt-ready") return;
      const pending = offered;
      offered = null;
      try {
        state.promptStarted();
        await pending.prompt();
        const choice = await pending.userChoice;
        if (!disposed) state.promptChoice(choice.outcome === "accepted");
      } catch {
        if (!disposed) state.promptFailed();
      }
    },
    inspectStorage: () => inspectPublicShellStorage(port.caches, port.storage, port.onLine()),
    async clearCache(): Promise<number> {
      if (disposed || !port.caches) return 0;
      const cleared = await clearPublicShellStorage(port.caches);
      if (!disposed && cleared > 0) state.setOffline("available");
      return cleared;
    },
    confirmSavedWork: (confirmed) => state.confirmSavedWork(confirmed),
    applyUpdate(): boolean {
      if (disposed || !state.canApplyUpdate() || !isOurWorker(registered?.waiting)) return false;
      try {
        registered!.waiting!.postMessage({ type: "BELJOUR_ACTIVATE_AFTER_SAVE" });
        state.appliedUpdate();
        return true;
      } catch {
        return false;
      }
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      port.removeEventListener("beforeinstallprompt", offeredPrompt);
      port.removeEventListener("appinstalled", installed);
      port.workers?.removeEventListener("controllerchange", changed);
      registered?.removeEventListener("updatefound", updateFound);
      registered = null;
      offered = null;
      state.dispose();
    },
  };
}
