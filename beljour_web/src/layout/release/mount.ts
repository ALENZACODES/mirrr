/** Opt-in Home review; no network or visitor photo access. Author: John Khan. */
import {
  commandReadiness, type ReleaseCommandResult,
} from "./commands.js";
import {
  readDeviceEnvironment, sampleDrawnCanvas,
  type CanvasSampling, type DeviceEnvironment,
} from "./device.js";
import { evaluateReleaseReadiness } from "./readiness.js";
import {
  safeReleaseReport, saveReleaseReport,
} from "./report.js";
import { ReleaseSession } from "./state.js";
import { inspectReleaseFile } from "./import-review.js";
import { renderReleaseView, type ReleaseActions } from "./view.js";
import type { ReleaseCheckId, ReleaseRefusal } from "./catalogue.js";
import type { PublicProCommandPort } from "../continuous/pro-commands.js";

export interface ReleaseOptions {
  readonly now?: () => number;
  readonly proCommands?: PublicProCommandPort | null;
  readonly device?: DeviceEnvironment | null;
  readonly createCanvas?: (width: number, height: number) => HTMLCanvasElement;
}

export interface ReleaseWorkspace {
  readonly state: ReleaseSession;
  readonly commands: ReleaseCommandResult;
  readonly active: () => boolean;
  render(): void;
  dispose(): void;
}

export function mountReleaseWorkspace(
  doc: Document, host: HTMLElement, onExit: () => void,
  options: ReleaseOptions = {},
): ReleaseWorkspace {
  const now = options.now ?? (() => performance.now());
  const state = new ReleaseSession(now);
  const commands = commandReadiness(options.proCommands ?? null);
  let environment: DeviceEnvironment | null = options.device ?? null;
  let sampling: CanvasSampling | null = null;
  let disposed = false;
  let importRevision = 0;
  let message = "Start the review to record manual application checks.";

  function render(): void {
    if (disposed) return;
    const snapshot = state.snapshot;
    const readiness = evaluateReleaseReadiness(snapshot, commands, environment, sampling);
    renderReleaseView(doc, host, snapshot, readiness, commands,
      environment, sampling, actions, message);
  }

  function feedback(text: string): void {
    message = text;
    render();
  }

  function guarded(action: () => void, success: string): void {
    if (disposed) return;
    try {
      action();
      feedback(success);
    } catch {
      feedback("That review action was refused. Previous observations remain unchanged.");
    }
  }

  const actions: ReleaseActions = {
    start(): void {
      guarded(() => state.start(), "Rehearsal started. Only actual observed actions can be recorded.");
    },
    stop(): void {
      guarded(() => state.stop(), "Rehearsal stopped. No production gate has been certified.");
    },
    reset(): void {
      if (disposed) return;
      importRevision += 1;
      state.reset();
      sampling = null;
      feedback("All local observations and timing have been cleared.");
    },
    exit(): void {
      if (disposed) return;
      dispose();
      onExit();
    },
    open(id: ReleaseCheckId): void {
      guarded(() => state.open(id),
        "Route opened or opening attempted; the result is not yet verified.");
    },
    review(id: ReleaseCheckId): void {
      guarded(() => state.review(id), "Operator-reported review recorded, not release acceptance.");
    },
    refuse(id: ReleaseCheckId, reason: ReleaseRefusal): void {
      guarded(() => state.refuse(id, reason), "A refusal was recorded without simulating success.");
    },
    clear(id: ReleaseCheckId): void {
      guarded(() => state.clear(id), "This local observation has been cleared.");
    },
    runCanvas(): void {
      if (disposed || state.snapshot.phase !== "running") return;
      sampling = sampleDrawnCanvas({
        now,
        createCanvas: options.createCanvas ?? ((width, height) => {
          const canvas = doc.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          return canvas;
        }),
      });
      feedback(sampling.status === "measured"
        ? "Measured synthetic Canvas drawing on this device; this is not an edit budget pass."
        : "Canvas measurement unavailable. No fallback network request was used.");
    },
    inspect(file: File | null): void {
      if (disposed) return;
      const revision = ++importRevision;
      void inspectReleaseFile(file, () => importRevision, revision).then((result) => {
        if (disposed || revision !== importRevision) return;
        feedback(result.note);
      });
    },
    report(): void {
      if (disposed) return;
      const snapshot = state.snapshot;
      const readiness = evaluateReleaseReadiness(snapshot, commands, environment, sampling);
      try {
        const report = safeReleaseReport(snapshot, readiness, commands, environment, sampling);
        saveReleaseReport(report, {
          createObjectURL: (blob) => URL.createObjectURL(blob),
          revokeObjectURL: (url) => URL.revokeObjectURL(url),
          createAnchor: () => doc.createElement("a"),
        });
        feedback("Photo-free local report download requested. Receipt is not verified.");
      } catch {
        feedback("Report download unavailable. No personal information was uploaded.");
      }
    },
  };

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    importRevision += 1;
    state.reset();
    environment = null;
    sampling = null;
    host.replaceChildren();
  }

  if (environment === null) {
    try {
      environment = readDeviceEnvironment(doc, doc.defaultView ?? window);
    } catch {
      environment = null;
    }
  }
  render();
  return { state, commands, active: () => !disposed, render, dispose };
}
