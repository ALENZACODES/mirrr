/** DOM-free state for the seven-fix posture panel: photo readiness, levels and lock.
 * A fix is offered only for a confirmed matching view with both masks present, and a
 * face-adjacent fix also needs an identity guard. Nothing is inferred from pixels.
 * Author: John Khan.
 */
import { DEFAULT_POSTURE_LEVEL, DEFAULT_POSTURE_LOCK, FACE_MOVING_FIXES, type FixName, PostureLevelMemory, type View,
  checkedPostureLevel, postureFixes } from "../engines/local/posture.js";

export interface PanelPhoto {
  digest: string;
  width: number;
  height: number;
  /** Confirmed by the user; null until they choose front or side. */
  view: View | null;
  personMask: boolean;
  headMask: boolean;
}

export type FixBlock = "photo_required" | "view_required" | "wrong_view" | "person_mask_required"
  | "head_mask_required" | "identity_guard_required";

export interface FixAvailability {
  fix: FixName;
  id: string;
  name: string;
  view: View;
  enabled: boolean;
  reason: FixBlock | null;
  warning: string;
}

export interface PanelSnapshot {
  photo: PanelPhoto | null;
  selected: FixName | null;
  level: number;
  lockLevel: number;
  guardAvailable: boolean;
  fixes: FixAvailability[];
}

const DIGEST = /^[0-9a-f]{64}$/;

export function checkedPanelPhoto(photo: PanelPhoto): PanelPhoto {
  if (!photo || !DIGEST.test(photo.digest)) throw new RangeError("photo digest must be 64 lowercase hex characters");
  if (!(Number.isInteger(photo.width) && Number.isInteger(photo.height) && photo.width >= 8 && photo.height >= 8 &&
      photo.width <= 16384 && photo.height <= 16384)) {
    throw new RangeError("invalid photo dimensions");
  }
  if (photo.view !== null && photo.view !== "front" && photo.view !== "side") throw new RangeError("view must be front or side");
  if (typeof photo.personMask !== "boolean" || typeof photo.headMask !== "boolean") {
    throw new RangeError("mask readiness must be explicit booleans");
  }
  return { ...photo };
}

export class PosturePanelState {
  private photoValue: PanelPhoto | null = null;
  private selectedFix: FixName | null = null;
  private lock = DEFAULT_POSTURE_LOCK;
  private guard = false;
  private readonly levels = new PostureLevelMemory();

  /** A new photo clears the selection; saved per-fix levels and the lock remain. */
  setPhoto(photo: PanelPhoto | null): PanelSnapshot {
    this.photoValue = photo === null ? null : checkedPanelPhoto(photo);
    this.selectedFix = null;
    return this.snapshot();
  }

  setGuardAvailable(available: boolean): PanelSnapshot {
    this.guard = available === true;
    if (this.selectedFix && !this.availability(this.selectedFix).enabled) this.selectedFix = null;
    return this.snapshot();
  }

  availability(fix: FixName): FixAvailability {
    const entry = postureFixes().find((item) => item.fix === fix);
    if (!entry) throw new RangeError("unknown posture fix");
    const photo = this.photoValue;
    let reason: FixBlock | null = null;
    if (!photo) reason = "photo_required";
    else if (photo.view === null) reason = "view_required";
    else if (photo.view !== entry.view) reason = "wrong_view";
    else if (!photo.personMask) reason = "person_mask_required";
    else if (!photo.headMask) reason = "head_mask_required";
    else if (FACE_MOVING_FIXES.has(fix) && !this.guard) reason = "identity_guard_required";
    return { fix, id: entry.id, name: entry.name, view: entry.view, enabled: reason === null, reason,
      warning: entry.reason };
  }

  select(fix: FixName): PanelSnapshot {
    const state = this.availability(fix);
    if (!state.enabled) throw new RangeError(`posture fix unavailable: ${state.reason}`);
    this.selectedFix = fix;
    return this.snapshot();
  }

  setLevel(level: number): PanelSnapshot {
    if (!this.selectedFix) throw new RangeError("choose a posture fix first");
    this.levels.set(this.selectedFix, level);
    return this.snapshot();
  }

  setLock(level: number): PanelSnapshot {
    this.lock = checkedPostureLevel(level);
    return this.snapshot();
  }

  get selected(): FixName | null { return this.selectedFix; }
  get level(): number { return this.selectedFix ? this.levels.get(this.selectedFix) : DEFAULT_POSTURE_LEVEL; }
  get lockLevel(): number { return this.lock; }
  get photo(): PanelPhoto | null { return this.photoValue ? { ...this.photoValue } : null; }

  snapshot(): PanelSnapshot {
    return { photo: this.photo, selected: this.selectedFix, level: this.level, lockLevel: this.lock,
      guardAvailable: this.guard,
      fixes: postureFixes().map((entry) => this.availability(entry.fix)) };
  }
}
