/** In-memory annotation history with bounded ownership and review state. Author: John Khan. */
import { number } from "./contracts.js";
import { exportObservations, observationDocument, parseObservations, validateMarks, type BrowMark, type ObservationDocument } from "./annotations.js";

export interface ObservationState {
  document: ObservationDocument;
  revision: number;
  canUndo: boolean;
  canRedo: boolean;
  dirty: boolean;
  disposed: boolean;
}
export class BrowObservationEditor {
  private document: ObservationDocument;
  private undoStack: ObservationDocument[] = [];
  private redoStack: ObservationDocument[] = [];
  private revision = 0;
  private savedRevision = 0;
  private disposed = false;
  private listeners = new Set<(state: ObservationState) => void>();
  readonly historyLimit: number;

  constructor(width: number, height: number, historyLimit = 24) {
    number(historyLimit, "historyLimit", 1, 48);
    if (!Number.isInteger(historyLimit)) throw new RangeError("historyLimit must be an integer");
    this.historyLimit = historyLimit;
    this.document = observationDocument(width, height, []);
  }

  private active(): void {
    if (this.disposed) throw new Error("brow observation editor is disposed");
  }

  private copy(document: ObservationDocument): ObservationDocument {
    return observationDocument(document.width, document.height, document.marks, document.reviewed);
  }

  state(): ObservationState {
    return { document: this.copy(this.document), revision: this.revision,
      canUndo: this.undoStack.length > 0, canRedo: this.redoStack.length > 0,
      dirty: this.revision !== this.savedRevision, disposed: this.disposed };
  }

  subscribe(listener: (state: ObservationState) => void): () => void {
    this.active();
    this.listeners.add(listener);
    listener(this.state());
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of [...this.listeners]) {
      try { listener(this.state()); } catch { /* A view failure cannot discard an edit. */ }
    }
  }

  private commit(next: ObservationDocument): void {
    this.active();
    this.undoStack.push(this.copy(this.document));
    if (this.undoStack.length > this.historyLimit) this.undoStack.shift();
    this.redoStack.length = 0;
    this.document = this.copy(next);
    this.revision++;
    this.notify();
  }

  add(mark: BrowMark): void {
    this.active();
    const marks = validateMarks([...this.document.marks, mark]);
    this.commit(observationDocument(this.document.width, this.document.height, marks, false));
  }

  replace(index: number, mark: BrowMark): void {
    this.active();
    if (!Number.isInteger(index) || index < 0 || index >= this.document.marks.length) throw new RangeError("mark index is out of range");
    const marks = validateMarks(this.document.marks);
    marks[index] = validateMarks([mark])[0];
    this.commit(observationDocument(this.document.width, this.document.height, marks, false));
  }

  remove(index: number): void {
    this.active();
    if (!Number.isInteger(index) || index < 0 || index >= this.document.marks.length) throw new RangeError("mark index is out of range");
    const marks = this.document.marks.filter((_, i) => i !== index);
    this.commit(observationDocument(this.document.width, this.document.height, marks, false));
  }

  confirmReview(): void {
    this.active();
    this.commit(observationDocument(this.document.width, this.document.height, this.document.marks, true));
  }

  clear(): void {
    this.active();
    this.commit(observationDocument(this.document.width, this.document.height, []));
  }

  undo(): boolean {
    this.active();
    const previous = this.undoStack.pop();
    if (!previous) return false;
    this.redoStack.push(this.copy(this.document));
    this.document = previous;
    this.revision++;
    this.notify();
    return true;
  }

  redo(): boolean {
    this.active();
    const next = this.redoStack.pop();
    if (!next) return false;
    this.undoStack.push(this.copy(this.document));
    this.document = next;
    this.revision++;
    this.notify();
    return true;
  }

  importText(value: string): void {
    this.active();
    const document = parseObservations(value, [this.document.width, this.document.height]);
    this.commit(document);
  }

  exportText(): string {
    this.active();
    const text = exportObservations(this.document);
    this.savedRevision = this.revision;
    this.notify();
    return text;
  }

  dispose(): void {
    if (this.disposed) return;
    this.document = observationDocument(this.document.width, this.document.height, []);
    this.undoStack.length = 0;
    this.redoStack.length = 0;
    this.disposed = true;
    this.revision++;
    this.notify();
    this.listeners.clear();
  }
}
