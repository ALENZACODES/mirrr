/** Privacy-safe observations for Judge Mode: fixed labels and counts only. */
import { TOUR_STEPS, type TourState, type TourStep } from "./contract.js";

export type TourObservation = "visited" | "completed" | "skipped" | "mock" | "export-requested";

export interface TourEvent {
  readonly code: TourObservation;
  readonly step: TourStep;
  readonly elapsedMs: number;
}

export interface TourEvidenceSummary {
  readonly completed: number;
  readonly skipped: number;
  readonly total: number;
  readonly exportRequested: boolean;
  readonly mockOnly: boolean;
  readonly providerEvidence: false;
  readonly realFaceEvidence: false;
  readonly currentStep: TourStep;
}

export class ContinuousEvidence {
  private events: TourEvent[] = [];
  private disposed = false;
  private readonly maxEvents = 96;

  record(code: TourObservation, step: TourStep, elapsedMs: number): void {
    if (this.disposed) throw new Error("Evidence collection ended");
    if (!TOUR_STEPS.some((row) => row.id === step)) throw new RangeError("Unknown evidence step");
    if (!["visited", "completed", "skipped", "mock", "export-requested"].includes(code)) {
      throw new RangeError("Unknown observation");
    }
    if (!Number.isFinite(elapsedMs) || elapsedMs < 0 || elapsedMs > 86_400_000) {
      throw new RangeError("Invalid rehearsal duration");
    }
    if (this.events.length >= this.maxEvents) this.events.shift();
    this.events.push(Object.freeze({ code, step, elapsedMs: Math.round(elapsedMs) }));
  }

  snapshot(): readonly TourEvent[] {
    return this.events.map((item) => ({ ...item }));
  }

  summary(state: TourState): TourEvidenceSummary {
    return {
      completed: state.completed.length,
      skipped: state.skipped.length,
      total: TOUR_STEPS.length,
      exportRequested: state.requestedDownload,
      mockOnly: state.mockResult === "mock-applied",
      providerEvidence: false,
      realFaceEvidence: false,
      currentStep: state.step,
    };
  }

  report(state: TourState): string {
    const summary = this.summary(state);
    const rows = [
      "BELJOUR — FULL BEAUTY STUDIO · Your best day. Still you. | Continuous Judge Mode rehearsal",
      "Status: synthetic / mocked demonstration only",
      `Steps observed: ${summary.completed}/${summary.total}`,
      `Steps skipped: ${summary.skipped}`,
      `Mock try-on: ${summary.mockOnly ? "observed locally" : "not observed"}`,
      `Export request: ${summary.exportRequested ? "requested" : "not requested"}`,
      "Live YouCam evidence: none",
      "Real-face evidence: none",
      "Release/quality gate: not established by this report",
      ...this.events.map((event) => `${event.step} | ${event.code} | ${event.elapsedMs}ms`),
    ];
    return rows.join("\n");
  }

  reset(): void {
    this.events = [];
  }

  dispose(): void {
    this.reset();
    this.disposed = true;
  }
}
