/** Revision-aware state machine for the optional local continuous demonstration. */
import { recognizedProCommand } from "./pro-commands.js";
import {
  TOUR_STEPS,
  checkedLevel,
  defaultLevels,
  emptyApplied,
  requiredPermission,
  stepAt,
  stepIndex,
  type TourApplied,
  type TourEffect,
  type TourGenderCue,
  type TourLevels,
  type TourMockResult,
  type TourPermission,
  type TourPermissions,
  type TourReadiness,
  type TourState,
  type TourStep,
} from "./contract.js";

const NO_PERMISSION: TourPermissions = { local: false, hair: false, face: false, mock: false };

/** State is settings-only; canvas, image, fingerprints and user names remain elsewhere. */
export class ContinuousDemoState {
  private step: TourStep = "source";
  private sourceLoaded = false;
  private faceCount = 0;
  private selectedId: string | null = null;
  private sourceRevision = 0;
  private permissions: TourPermissions = { ...NO_PERMISSION };
  private identityLock = true;
  private levels: Record<TourEffect, number> = defaultLevels();
  private applied: Record<TourEffect, boolean> = emptyApplied();
  private appearanceCue: TourGenderCue = "none";
  private mockMode: "off" | "mock" = "mock";
  private mockResult: TourMockResult = "not-requested";
  private comparePercent = 50;
  private requestedDownload = false;
  private readonly completed = new Set<TourStep>();
  private readonly skipped = new Set<TourStep>();
  private readonly reviewed = new Set<string>();
  private seasonalId: string | null = null;
  private disposed = false;

  get snapshot(): TourState {
    this.assertLive();
    return {
      step: this.step,
      sourceLoaded: this.sourceLoaded,
      faceCount: this.faceCount,
      selectedId: this.selectedId,
      sourceRevision: this.sourceRevision,
      permissions: { ...this.permissions },
      identityLock: this.identityLock,
      levels: { ...this.levels },
      applied: { ...this.applied },
      appearanceCue: this.appearanceCue,
      mockMode: this.mockMode,
      mockResult: this.mockResult,
      comparePercent: this.comparePercent,
      requestedDownload: this.requestedDownload,
      completed: [...this.completed],
      skipped: [...this.skipped],
      proCommandsReviewed: [...this.reviewed],
      seasonalId: this.seasonalId,
    };
  }

  chooseDrawnSource(revision: number, count: number, selected: string | null): void {
    this.assertLive();
    if (!Number.isInteger(revision) || revision < 1 || revision <= this.sourceRevision) {
      throw new RangeError("Source revision must advance");
    }
    if (!Number.isInteger(count) || count < 1 || count > 20) {
      throw new RangeError("A checked drawn face count is required");
    }
    if (count > 1 && !selected) throw new Error("A drawn primary subject is required");
    this.sourceRevision = revision;
    this.sourceLoaded = true;
    this.faceCount = count;
    this.selectedId = selected;
    this.permissions = { ...NO_PERMISSION };
    this.identityLock = true;
    this.levels = defaultLevels();
    this.applied = emptyApplied();
    this.appearanceCue = "none";
    this.mockResult = "not-requested";
    this.comparePercent = 50;
    this.requestedDownload = false;
    this.reviewed.clear();
    this.seasonalId = null;
    this.completed.clear();
    this.skipped.clear();
  }

  selectSubject(id: string, accepted: boolean): boolean {
    this.assertLive();
    if (!accepted || !id || id.length > 48 || !this.sourceLoaded) return false;
    if (this.selectedId === id) return true;
    this.selectedId = id;
    this.invalidateEdits();
    return true;
  }

  setPermission(action: TourPermission, enabled: boolean): void {
    this.assertLive();
    if (!(action in this.permissions) || typeof enabled !== "boolean") {
      throw new RangeError("Invalid demo permission");
    }
    this.permissions = { ...this.permissions, [action]: enabled };
    if (!enabled) {
      if (action === "local") this.applied = emptyApplied();
      if (action === "hair") {
        this.applied.hair = false;
        this.applied.colour = false;
      }
      if (action === "face") {
        for (const effect of ["concealer", "appearance", "ratio", "turn", "posture"] as const) {
          this.applied[effect] = false;
        }
      }
      this.invalidateDownstream();
    }
  }

  setIdentityLock(enabled: boolean): void {
    this.assertLive();
    if (typeof enabled !== "boolean") throw new TypeError("Identity lock must be boolean");
    this.identityLock = enabled;
    if (!enabled) this.invalidateDownstream();
  }

  setStrength(effect: TourEffect, level: number): void {
    this.assertLive();
    if (!(effect in this.levels)) throw new RangeError("Unrecognized effect");
    this.levels[effect] = checkedLevel(level);
    if (this.applied[effect]) this.invalidateDownstream();
  }

  apply(effect: TourEffect): boolean {
    this.assertLive();
    if (!(effect in this.applied)) throw new RangeError("Unrecognized effect");
    if (!this.sourceLoaded || (this.faceCount > 1 && !this.selectedId)) return false;
    if (!this.identityLock || !this.permissions.local || !this.permissions[requiredPermission(effect)]) {
      return false;
    }
    this.applied[effect] = true;
    this.invalidateDownstream();
    return true;
  }

  setAppearance(cue: TourGenderCue): void {
    this.assertLive();
    if (!(["none", "masc", "fem"] as readonly string[]).includes(cue)) {
      throw new RangeError("Invalid illustrative cue");
    }
    this.appearanceCue = cue;
    this.applied.appearance = false;
    this.invalidateDownstream();
  }

  chooseMockMode(mode: "mock" | "off"): void {
    this.assertLive();
    if (mode !== "mock" && mode !== "off") throw new RangeError("Unknown provider demo mode");
    this.mockMode = mode;
    this.mockResult = "not-requested";
    this.requestedDownload = false;
  }

  recordTryon(result: TourMockResult): void {
    this.assertLive();
    if (!(["mock-applied", "provider-disabled", "consent-required"] as string[]).includes(result)) {
      throw new RangeError("Unsupported try-on result");
    }
    this.mockResult = result;
    this.requestedDownload = false;
  }

  reviewCommand(name: string): boolean {
    this.assertLive();
    if (!recognizedProCommand(name)) return false;
    this.reviewed.add(name);
    return true;
  }

  selectSeason(id: string | null): void {
    this.assertLive();
    if (id !== null && (!/^[a-zA-Z0-9_-]{1,64}$/.test(id))) {
      throw new RangeError("Invalid seasonal pack identifier");
    }
    this.seasonalId = id;
  }

  compare(percent: number): void {
    this.assertLive();
    if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
      throw new RangeError("Comparison must be in range 0–100");
    }
    this.comparePercent = percent;
  }

  recordDownload(): void {
    this.assertLive();
    if (!this.sourceLoaded || !this.identityLock || !this.permissions.local) {
      throw new Error("Cannot export an unapproved illustration");
    }
    this.requestedDownload = true;
  }

  readiness(step: TourStep = this.step): TourReadiness {
    this.assertLive();
    if (step === "source") return this.result(this.sourceLoaded, "Open a drawn sample", "drawn");
    if (step === "faces") return this.result(this.faceCount > 0, "Drawn figure boxes are missing", "drawn");
    if (step === "subject") return this.result(this.faceCount > 0 && this.selectedId !== null,
      "Select a figure before continuing", "drawn");
    if (step === "consent") return this.result(this.permissions.local && this.permissions.hair
      && this.permissions.face, "Enable local, hair and face consent", "operator");
    if (["hair", "colour", "concealer", "appearance", "ratio", "turn", "posture"].includes(step)) {
      const effect = step as TourEffect;
      return this.result(this.applied[effect], `Apply the ${effect} illustration first`, "drawn");
    }
    if (step === "pro") return this.result(this.reviewed.size === 5,
      "Review all five named commands", "operator");
    if (step === "seasonal") return { allowed: true, observed: this.seasonalId !== null,
      evidence: "unverified", reason: "Public seasonal packs may be unavailable" };
    if (step === "tryon") return this.result(this.mockResult === "mock-applied"
      || this.mockResult === "provider-disabled", "Choose mock or provider-off preview", "mock");
    if (step === "compare") return this.result(this.comparePercent !== 50,
      "Move the before/after divider", "operator");
    if (step === "save") return this.result(this.requestedDownload,
      "Request the labelled file to complete export", "operator");
    return { allowed: true, observed: false, evidence: "unverified", reason: "" };
  }

  next(skip = false): boolean {
    this.assertLive();
    const current = this.step;
    if (!skip && !this.readiness().allowed) return false;
    if (skip) this.skipped.add(current);
    else this.completed.add(current);
    const index = stepIndex(current);
    if (index + 1 >= TOUR_STEPS.length) return false;
    this.step = stepAt(index + 1);
    return true;
  }

  back(): boolean {
    this.assertLive();
    const index = stepIndex(this.step);
    if (index < 1) return false;
    this.step = stepAt(index - 1);
    return true;
  }

  reset(): void {
    this.assertLive();
    this.step = "source";
    this.sourceLoaded = false;
    this.faceCount = 0;
    this.selectedId = null;
    this.sourceRevision += 1;
    this.permissions = { ...NO_PERMISSION };
    this.identityLock = true;
    this.levels = defaultLevels();
    this.applied = emptyApplied();
    this.appearanceCue = "none";
    this.mockMode = "mock";
    this.mockResult = "not-requested";
    this.comparePercent = 50;
    this.requestedDownload = false;
    this.completed.clear();
    this.skipped.clear();
    this.reviewed.clear();
    this.seasonalId = null;
  }

  dispose(): void {
    if (this.disposed) return;
    this.reset();
    this.disposed = true;
  }

  private assertLive(): void {
    if (this.disposed) throw new Error("The judge walkthrough was closed");
  }

  private invalidateDownstream(): void {
    this.mockResult = "not-requested";
    this.requestedDownload = false;
    this.completed.delete("tryon");
    this.completed.delete("compare");
    this.completed.delete("save");
  }

  private invalidateEdits(): void {
    this.applied = emptyApplied();
    this.appearanceCue = "none";
    this.invalidateDownstream();
    for (const effect of ["hair", "colour", "concealer", "appearance", "ratio", "turn", "posture"] as const) {
      this.completed.delete(effect);
    }
  }

  private result(observed: boolean, reason: string, evidence: TourReadiness["evidence"]): TourReadiness {
    return { allowed: observed, observed, evidence, reason: observed ? "" : reason };
  }
}

export function countApplied(applied: TourApplied): number {
  return Object.values(applied).filter(Boolean).length;
}

export function minimumLevel(levels: TourLevels): number {
  return Math.min(...Object.values(levels));
}
