/** In-memory state for one walkthrough. No persistence and no provider permissions. */
import { parseVisibleStrength } from "./strength-scale.js";
import { EMPTY_JUDGE_DETAILS, type JudgeDetail, type JudgeDetails } from "./judge-five-edits.js";
import {
  JUDGE_STEPS,
  judgeIndex,
  judgeStepAt,
  type JudgeAction,
  type JudgeFace,
  type JudgeFormat,
  type JudgeHair,
  type JudgePermissions,
  type JudgeSize,
  type JudgeSourceKind,
  type JudgeState,
  type JudgeStep,
} from "./judge-contract.js";

const EMPTY_PERMISSIONS: JudgePermissions = {
  local: false,
  hair: false,
  face: false,
  mock: false,
};

export class JudgeSession {
  private step: JudgeStep = "source";
  private source: JudgeSourceKind | null = null;
  private permissions: JudgePermissions = { ...EMPTY_PERMISSIONS };
  private hair: JudgeHair = "none";
  private face: JudgeFace = "none";
  private details: JudgeDetails = { ...EMPTY_JUDGE_DETAILS };
  private mock = false;
  private comparison = 50;
  private format: JudgeFormat = "image/png";
  private size: JudgeSize = "standard";
  private strength = 5.0;
  private readonly completed = new Set<JudgeStep>();
  private readonly skipped = new Set<JudgeStep>();

  get snapshot(): JudgeState {
    return {
      step: this.step,
      source: this.source,
      permissions: { ...this.permissions },
      hair: this.hair,
      face: this.face,
      details: { ...this.details },
      mock: this.mock,
      comparison: this.comparison,
      format: this.format,
      size: this.size,
      strength: this.strength,
      complete: [...this.completed],
      skipped: [...this.skipped],
    };
  }

  selectSource(kind: JudgeSourceKind): void {
    if (kind !== "sample" && kind !== "upload") throw new RangeError("Invalid source");
    this.source = kind;
    this.hair = "none";
    this.face = "none";
    this.details = { ...EMPTY_JUDGE_DETAILS };
    this.mock = false;
    this.strength = 5.0;
    this.completed.clear();
    this.skipped.clear();
  }

  clearSource(): void {
    this.source = null;
    this.hair = "none";
    this.face = "none";
    this.details = { ...EMPTY_JUDGE_DETAILS };
    this.mock = false;
    this.completed.clear();
  }

  consent(action: JudgeAction, granted: boolean): void {
    if (!(action in EMPTY_PERMISSIONS)) throw new RangeError("Unknown demonstration permission");
    this.permissions = { ...this.permissions, [action]: granted };
    if (action === "local" && !granted) {
      this.permissions = { ...EMPTY_PERMISSIONS };
      this.hair = "none";
      this.face = "none";
      this.details = { ...EMPTY_JUDGE_DETAILS };
      this.mock = false;
      return;
    }
    if (!granted && action === "hair") {
      this.hair = "none";
      this.details = { ...this.details, "hair-highlight": false };
    }
    if (!granted && action === "face") {
      this.face = "none";
      this.details = { ...this.details, "lip-colour": false, eyeliner: false };
    }
    if (!granted && action === "mock") this.mock = false;
  }

  setHair(shade: JudgeHair): boolean {
    if (!(["none", "chestnut", "deep-blue"] as string[]).includes(shade)) return false;
    if (!this.source || !this.permissions.local || !this.permissions.hair) return false;
    this.hair = shade;
    return true;
  }

  setFace(tone: JudgeFace): boolean {
    if (!(["none", "warm", "cool"] as string[]).includes(tone)) return false;
    if (!this.source || !this.permissions.local || !this.permissions.face) return false;
    this.face = tone;
    return true;
  }

  /** Local-only accessory controls; every toggle needs matching action consent. */
  setDetail(detail: JudgeDetail, enabled: boolean): boolean {
    if (!(detail in EMPTY_JUDGE_DETAILS) || typeof enabled !== "boolean") return false;
    const scope = detail === "hair-highlight" ? "hair" : "face";
    if (!this.source || !this.permissions.local || !this.permissions[scope]) return false;
    this.details = { ...this.details, [detail]: enabled };
    return true;
  }

  /** One explicit button can rehearse five distinct drawn effects, never a provider task. */
  applyFiveIllustrations(): boolean {
    if (!this.source || !this.permissions.local || !this.permissions.hair || !this.permissions.face) {
      return false;
    }
    this.hair = "chestnut";
    this.face = "warm";
    this.details = { "hair-highlight": true, "lip-colour": true, eyeliner: true };
    return true;
  }

  setMock(enabled: boolean): boolean {
    if (!this.source || !this.permissions.local || !this.permissions.mock) return false;
    this.mock = enabled;
    return true;
  }

  setStrength(value: number): boolean {
    try {
      this.strength = parseVisibleStrength(value);
      return true;
    } catch {
      return false;
    }
  }

  setComparison(percent: number): void {
    if (!Number.isFinite(percent)) return;
    this.comparison = Math.max(0, Math.min(100, Math.round(percent)));
  }

  setExport(format: JudgeFormat, size: JudgeSize): boolean {
    if (format !== "image/png" && format !== "image/jpeg") return false;
    if (size !== "standard" && size !== "large") return false;
    this.format = format;
    this.size = size;
    return true;
  }

  get unmet(): string | null {
    if (this.step === "source" && !this.source) return "Choose the drawn sample or a local photo.";
    if (this.step === "consent" && !this.permissions.local) {
      return "Confirm local processing to continue, or skip this step.";
    }
    if (this.step === "hair" && this.hair === "none") {
      return "Apply a hair-colour overlay, or skip this step.";
    }
    if (this.step === "face" && this.face === "none") {
      return "Apply a face-colour overlay, or skip this step.";
    }
    if (this.step === "tryon" && !this.mock) return "Start the labelled mock try-on, or skip.";
    return null;
  }

  next(): boolean {
    if (this.unmet || this.step === "plans") return false;
    this.completed.add(this.step);
    this.skipped.delete(this.step);
    this.step = judgeStepAt(judgeIndex(this.step) + 1);
    return true;
  }

  skip(): boolean {
    if (this.step === "plans") return false;
    this.skipped.add(this.step);
    this.completed.delete(this.step);
    this.step = judgeStepAt(judgeIndex(this.step) + 1);
    return true;
  }

  back(): boolean {
    const index = judgeIndex(this.step);
    if (index === 0) return false;
    this.step = judgeStepAt(index - 1);
    return true;
  }

  progress(): { number: number; total: number; percent: number } {
    const number = judgeIndex(this.step) + 1;
    return { number, total: JUDGE_STEPS.length, percent: Math.round(number / JUDGE_STEPS.length * 100) };
  }

  reset(): void {
    this.step = "source";
    this.source = null;
    this.permissions = { ...EMPTY_PERMISSIONS };
    this.hair = "none";
    this.face = "none";
    this.details = { ...EMPTY_JUDGE_DETAILS };
    this.mock = false;
    this.strength = 5.0;
    this.comparison = 50;
    this.format = "image/png";
    this.size = "standard";
    this.completed.clear();
    this.skipped.clear();
  }
}
