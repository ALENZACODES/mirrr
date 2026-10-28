/** Browser install/offline state. An accepted prompt never means installed. */
export type OfflineStage = "unsupported" | "available" | "enabling" | "ready" | "error";
export type InstallStage = "unsupported" | "browser-menu" | "prompt-ready" | "asking" | "accepted" | "dismissed" | "installed";

export interface InstallSnapshot {
  readonly offline: OfflineStage;
  readonly install: InstallStage;
  readonly updateWaiting: boolean;
  readonly updateAcknowledged: boolean;
  readonly errorCode: "none" | "registration" | "prompt" | "storage";
  readonly verifiedOffline: false;
  readonly explanation: string;
}

export interface InstallCapabilities {
  readonly secure: boolean;
  readonly worker: boolean;
  readonly standalone: boolean;
}

/** State is a UI fact, not a claim that editing works offline or on a phone. */
export class InstallState {
  private offline: OfflineStage;
  private install: InstallStage;
  private waiting = false;
  private acknowledged = false;
  private error: InstallSnapshot["errorCode"] = "none";
  private readonly observers = new Set<(state: InstallSnapshot) => void>();

  constructor(capability: InstallCapabilities) {
    this.offline = capability.secure && capability.worker ? "available" : "unsupported";
    this.install = capability.secure ? capability.standalone ? "installed" : "browser-menu" : "unsupported";
  }

  get snapshot(): InstallSnapshot {
    return {
      offline: this.offline,
      install: this.install,
      updateWaiting: this.waiting,
      updateAcknowledged: this.acknowledged,
      errorCode: this.error,
      verifiedOffline: false,
      explanation: "Only public shell files may be cached. Actual offline editing and device installation need real-browser checks.",
    };
  }

  subscribe(listener: (state: InstallSnapshot) => void): () => void {
    this.observers.add(listener);
    listener(this.snapshot);
    return () => this.observers.delete(listener);
  }

  private notify(): void {
    const snap = this.snapshot;
    for (const observer of this.observers) observer(snap);
  }

  setOffline(value: OfflineStage, error: InstallSnapshot["errorCode"] = "none"): void {
    if (this.offline === "unsupported" && value !== "unsupported") return;
    this.offline = value;
    this.error = error;
    this.notify();
  }

  promptAvailable(): void {
    if (this.install === "browser-menu" || this.install === "dismissed") {
      this.install = "prompt-ready";
      this.notify();
    }
  }

  promptStarted(): void {
    if (this.install !== "prompt-ready") throw new RangeError("No install prompt available");
    this.install = "asking";
    this.notify();
  }

  promptChoice(accepted: boolean): void {
    if (this.install !== "asking") throw new RangeError("Install choice without prompt");
    this.install = accepted ? "accepted" : "dismissed";
    this.notify();
  }

  promptFailed(): void {
    this.install = "browser-menu";
    this.error = "prompt";
    this.notify();
  }

  installed(): void {
    this.install = "installed";
    this.notify();
  }

  setUpdateWaiting(waiting: boolean): void {
    this.waiting = waiting;
    if (!waiting) this.acknowledged = false;
    this.notify();
  }

  confirmSavedWork(value: boolean): void {
    this.acknowledged = this.waiting && value;
    this.notify();
  }

  appliedUpdate(): void {
    this.waiting = false;
    this.acknowledged = false;
    this.notify();
  }

  canApplyUpdate(): boolean {
    return this.waiting && this.acknowledged;
  }

  dispose(): void {
    this.observers.clear();
  }
}
