/** Ephemeral face picker lifecycle with mandatory photo revision checks.
 * No persistent photos, masks or face coordinates. Author: John Khan.
 */
import { composeFace, makePicker, type Box, type Pick, type Picker } from "./face-picker.js";
import { auditPersonEdit, type PersonAudit } from "./face-region-audit.js";
export interface FaceSessionState {
  revision: number; faceCount: number; chosen: number | null;
  code: string; verifiedRegion: boolean;
}
export class FaceSelectionSession {
  private revision = 0;
  private current: Picker | null = null;
  private choice: Pick | null = null;
  private selected: Float32Array | null = null;
  private bystanders: Float32Array[] = [];
  private lastAudit: PersonAudit | null = null;
  private width = 0;
  private height = 0;
  newPhoto(boxes: readonly Box[], width: number, height: number): FaceSessionState {
    this.revision++;
    this.current = makePicker(boxes, width, height);
    this.width = width;
    this.height = height;
    this.choice = this.current.primary;
    this.selected = null;
    this.bystanders = [];
    this.lastAudit = null;
    return this.state();
  }
  state(): FaceSessionState {
    return { revision: this.revision, faceCount: this.choice?.visibleFaces ?? 0,
      chosen: this.choice?.index ?? null, code: this.choice?.code ?? "no_face_found",
      verifiedRegion: this.selected !== null };
  }
  tap(x: number, y: number): FaceSessionState {
    if (!this.current) return this.state();
    const candidate = this.current.tap(x, y);
    if (candidate.index !== null) this.set(candidate);
    return this.state();
  }
  select(index: number): FaceSessionState {
    if (!this.current) return this.state();
    const candidate = this.current.select(index);
    if (candidate.index !== null) this.set(candidate);
    return this.state();
  }
  private set(candidate: Pick): void {
    this.choice = candidate;
    this.selected = null;
    this.bystanders = [];
    this.lastAudit = null;
  }
  provideMasks(revision: number, selected: Float32Array, bystanders: readonly Float32Array[]): FaceSessionState {
    if (revision !== this.revision) throw new RangeError("stale photo revision");
    if (this.choice?.index === null || this.choice === null) throw new RangeError("select a face first");
    const expected = this.width * this.height;
    if (!(selected instanceof Float32Array) || selected.length !== expected ||
        !selected.some((v) => v > 0) || !selected.every((v) => Number.isFinite(v) && v >= 0 && v <= 1) ||
        !bystanders.every((m) => m instanceof Float32Array && m.length === expected &&
          m.every((v) => Number.isFinite(v) && v >= 0 && v <= 1))) {
      throw new RangeError("verified full-size person and bystander masks required");
    }
    this.selected = new Float32Array(selected);
    this.bystanders = bystanders.map((m) => new Float32Array(m));
    this.lastAudit = null;
    return this.state();
  }
  apply(revision: number, original: Uint8ClampedArray, edited: Uint8ClampedArray,
    width: number, height: number, channels: 3 | 4 = 4): Uint8ClampedArray {
    if (revision !== this.revision) throw new RangeError("photo changed during edit");
    if (this.choice?.index === null || !this.choice || !this.selected) {
      throw new RangeError("no chosen face with reviewed region");
    }
    const result = composeFace(original, edited, this.selected, this.bystanders, width, height, channels);
    const observed = auditPersonEdit({ data: original, width, height, channels },
      { data: result, width, height, channels }, this.selected, this.bystanders);
    if (!observed.passed) throw new RangeError(`selected-person isolation refused: ${observed.status}`);
    this.lastAudit = observed;
    return result;
  }
  auditCounts(): PersonAudit | null { return this.lastAudit ? { ...this.lastAudit } : null; }
  clear(): void {
    this.revision++;
    this.current = null;
    this.choice = null;
    this.selected = null;
    this.bystanders = [];
    this.lastAudit = null;
    this.width = 0;
    this.height = 0;
  }
}
