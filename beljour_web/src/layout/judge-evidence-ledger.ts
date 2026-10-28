/** Ephemeral event evidence for a self-contained Judge Mode rehearsal.
 * Records fixed action codes and relative durations only, never user input.
 */
export const JUDGE_MILESTONES = [
  "source-selected",
  "local-consent",
  "hair-applied",
  "face-applied",
  "mock-opened",
  "comparison-moved",
  "export-attempted",
  "download-requested",
  "plans-visited",
] as const;

export type JudgeMilestone = typeof JUDGE_MILESTONES[number];
export type JudgeConsentScope = "local" | "hair" | "face" | "mock";

export interface JudgeMilestoneEntry {
  readonly code: JudgeMilestone;
  readonly elapsedMs: number;
  readonly occurrence: number;
}

export interface JudgeEvidenceSnapshot {
  readonly entries: readonly JudgeMilestoneEntry[];
  readonly requestMade: boolean;
  readonly exportAttempts: number;
  readonly exportedImageConfirmed: false;
  readonly liveProviderCalls: 0;
  readonly networkImageUploads: 0;
}

const MAX_REHEARSAL_TIME = 24 * 60 * 60 * 1000;
const MAX_OCCURRENCE = 999;

const REVOKE_IMPLICATIONS: Readonly<Record<JudgeConsentScope, readonly JudgeMilestone[]>> = {
  local: [
    "local-consent",
    "hair-applied",
    "face-applied",
    "mock-opened",
    "comparison-moved",
    "export-attempted",
    "download-requested",
  ],
  hair: ["hair-applied", "comparison-moved", "export-attempted", "download-requested"],
  face: ["face-applied", "comparison-moved", "export-attempted", "download-requested"],
  mock: ["mock-opened", "comparison-moved", "export-attempted", "download-requested"],
};

function safeElapsed(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError("Invalid relative rehearsal time");
  }
  return Math.min(MAX_REHEARSAL_TIME, Math.floor(value));
}

/** One new source invalidates every prior observation and its export request. */
export class JudgeEvidenceLedger {
  private readonly observations = new Map<JudgeMilestone, JudgeMilestoneEntry>();
  private lastElapsedMs = 0;
  private attempts = 0;
  private disposed = false;

  get isDisposed(): boolean {
    return this.disposed;
  }

  has(code: JudgeMilestone): boolean {
    return !this.disposed && this.observations.has(code);
  }

  observedAt(code: JudgeMilestone): number | null {
    return this.observations.get(code)?.elapsedMs ?? null;
  }

  record(code: JudgeMilestone, elapsedMs: number): boolean {
    if (this.disposed) return false;
    if (!JUDGE_MILESTONES.includes(code)) {
      throw new RangeError("Unknown rehearsal event");
    }
    const elapsed = Math.max(this.lastElapsedMs, safeElapsed(elapsedMs));
    this.lastElapsedMs = elapsed;
    const prior = this.observations.get(code);
    this.observations.set(code, {
      code,
      elapsedMs: elapsed,
      occurrence: Math.min(MAX_OCCURRENCE, (prior?.occurrence ?? 0) + 1),
    });
    if (code === "export-attempted") {
      this.attempts = Math.min(MAX_OCCURRENCE, this.attempts + 1);
    }
    return true;
  }

  /** A consent change cannot keep stale evidence of an edit or export. */
  withdraw(scope: JudgeConsentScope): void {
    if (this.disposed) return;
    for (const code of REVOKE_IMPLICATIONS[scope]) {
      this.observations.delete(code);
    }
    this.attempts = 0;
  }

  /** A source change invalidates prior evidence, but does not persist anything. */
  reset(): void {
    if (this.disposed) return;
    this.observations.clear();
    this.attempts = 0;
    this.lastElapsedMs = 0;
  }

  /** Changing output options invalidates the prior save, not the image comparison. */
  changedExport(): void {
    if (this.disposed) return;
    this.observations.delete("export-attempted");
    this.observations.delete("download-requested");
    this.attempts = 0;
  }

  /** Explicitly forget invalidated activity when the local preview changes. */
  changedEdit(): void {
    if (this.disposed) return;
    this.observations.delete("comparison-moved");
    this.changedExport();
  }

  snapshot(): JudgeEvidenceSnapshot {
    const entries = JUDGE_MILESTONES.flatMap((code) => {
      const entry = this.observations.get(code);
      return entry ? [{ ...entry }] : [];
    }).sort((left, right) => left.elapsedMs - right.elapsedMs);
    return {
      entries,
      requestMade: this.has("download-requested"),
      exportAttempts: this.attempts,
      exportedImageConfirmed: false,
      liveProviderCalls: 0,
      networkImageUploads: 0,
    };
  }

  dispose(): void {
    if (this.disposed) return;
    this.reset();
    this.disposed = true;
  }
}

/** No event payload can contain a photo, filename, consent value or device ID. */
export function isSafeJudgeSnapshot(snapshot: JudgeEvidenceSnapshot): boolean {
  if (snapshot.liveProviderCalls !== 0 || snapshot.networkImageUploads !== 0) return false;
  if (snapshot.exportedImageConfirmed !== false) return false;
  if (!Number.isInteger(snapshot.exportAttempts)) return false;
  if (snapshot.exportAttempts < 0 || snapshot.exportAttempts > MAX_OCCURRENCE) return false;
  const keys = new Set<string>();
  let lastTime = 0;
  for (const entry of snapshot.entries) {
    if (!JUDGE_MILESTONES.includes(entry.code)) return false;
    if (keys.has(entry.code)) return false;
    if (!Number.isInteger(entry.elapsedMs) || entry.elapsedMs < 0) return false;
    if (entry.elapsedMs > MAX_REHEARSAL_TIME) return false;
    if (!Number.isInteger(entry.occurrence) || entry.occurrence < 1) return false;
    if (entry.elapsedMs < lastTime) return false;
    lastTime = entry.elapsedMs;
    keys.add(entry.code);
  }
  return snapshot.requestMade === keys.has("download-requested");
}
