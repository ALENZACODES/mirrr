/** Optional keyboard review counter. Stores element roles, never typed input. */
export type FocusKind = "link" | "button" | "input" | "control" | "other";

export interface FocusObservation {
  readonly total: number;
  readonly distinctKinds: readonly FocusKind[];
  readonly trappedCandidate: boolean;
  readonly started: boolean;
}

export interface FocusHost {
  addEventListener(type: "focusin", listener: EventListener): void;
  removeEventListener(type: "focusin", listener: EventListener): void;
}

export function focusKind(target: EventTarget | null): FocusKind {
  const tag = (target as Element | null)?.tagName?.toLowerCase();
  if (tag === "a") return "link";
  if (tag === "button") return "button";
  if (tag === "input" || tag === "textarea") return "input";
  if (tag === "select" || tag === "summary") return "control";
  return "other";
}

export class FocusObservationSession {
  private total = 0;
  private readonly kinds = new Set<FocusKind>();
  private readonly distinct = new Set<EventTarget>();
  private last: EventTarget | null = null;
  private repeated = 0;
  private active = false;
  private readonly handler: EventListener;

  constructor(private readonly host: FocusHost) {
    this.handler = (event) => {
      if (!this.active || !event.target) return;
      this.total = Math.min(this.total + 1, 10000);
      this.kinds.add(focusKind(event.target));
      if (this.distinct.size < 100) this.distinct.add(event.target);
      this.repeated = this.last === event.target ? this.repeated + 1 : 0;
      this.last = event.target;
    };
  }

  start(): void {
    if (this.active) return;
    this.total = 0;
    this.repeated = 0;
    this.last = null;
    this.kinds.clear();
    this.distinct.clear();
    this.active = true;
    this.host.addEventListener("focusin", this.handler);
  }

  stop(): FocusObservation {
    if (this.active) this.host.removeEventListener("focusin", this.handler);
    this.active = false;
    return this.snapshot;
  }

  get snapshot(): FocusObservation {
    return {
      total: this.total,
      distinctKinds: [...this.kinds].sort(),
      // A hint only. Returning to the same element can be intentional.
      trappedCandidate: this.total >= 8 && this.distinct.size === 1 && this.repeated >= 7,
      started: this.active,
    };
  }

  dispose(): void {
    this.stop();
    this.distinct.clear();
    this.kinds.clear();
    this.last = null;
  }
}
