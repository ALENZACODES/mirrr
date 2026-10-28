/** Immutable subject snapshots. A selected bystander cannot inherit previous edits. */
import {
  checkedSubjectBoxes,
  suggestedSubject,
  type SubjectBox,
  type SubjectSnapshot,
} from "./contract.js";

const NO_SUBJECT_REASON = "No verified face boxes are available for this image.";

export class SubjectSelection {
  private revision = 0;
  private boxes: readonly SubjectBox[] = [];
  private selectedId: string | null = null;
  private source: SubjectSnapshot["source"] = "none";
  private reason = NO_SUBJECT_REASON;

  get snapshot(): SubjectSnapshot {
    return Object.freeze({
      revision: this.revision,
      source: this.source,
      boxes: Object.freeze(this.boxes.map((box) => Object.freeze({ ...box }))),
      selectedId: this.selectedId,
      reason: this.reason,
    });
  }

  get active(): SubjectBox | null {
    return this.boxes.find((box) => box.id === this.selectedId) ?? null;
  }

  /** Every new source invalidates selection before asynchronous detection starts. */
  begin(revision: number, mode: SubjectSnapshot["source"] = "awaiting-detector"): void {
    if (!Number.isSafeInteger(revision) || revision <= this.revision) {
      throw new RangeError("Source revision must increase");
    }
    this.revision = revision;
    this.boxes = [];
    this.selectedId = null;
    this.source = mode;
    this.reason = mode === "awaiting-detector"
      ? "Face detection is not connected. No boxes are guessed from pixels."
      : NO_SUBJECT_REASON;
  }

  receive(revision: number, boxes: readonly SubjectBox[]): boolean {
    if (revision !== this.revision || this.source === "none") return false;
    const checked = checkedSubjectBoxes(boxes);
    const detected = checked.some((box) => box.origin === "detected");
    const drawn = checked.some((box) => box.origin === "drawn");
    if (detected && drawn) throw new RangeError("Do not mix drawn and detected face boxes");
    this.boxes = checked;
    this.selectedId = suggestedSubject(checked);
    this.source = checked.length ? (drawn ? "drawn" : "detected") : "awaiting-detector";
    this.reason = checked.length ? "Only the selected subject can receive illustrative edits." : NO_SUBJECT_REASON;
    return true;
  }

  choose(id: string): boolean {
    if (this.selectedId === id) return false;
    if (!this.boxes.some((box) => box.id === id)) return false;
    this.selectedId = id;
    return true;
  }

  clear(): void {
    this.revision += 1;
    this.boxes = [];
    this.selectedId = null;
    this.source = "none";
    this.reason = NO_SUBJECT_REASON;
  }
}
