/** No-network, session-only replay cache for the authored drawing. Author: John Khan. */
import {
  CASSETTE_CARDS,
  cassetteAuthority,
  cassetteById,
  cassettePermission,
  type CassetteAuthority,
  type CassetteCard,
  type CassetteId,
  type CassetteResult,
  type CassetteStatus,
} from "./cassette-contract.js";
import type { TourState } from "./contract.js";

interface CachedEntry {
  readonly card: CassetteCard;
  readonly revision: number;
  readonly subjectId: string;
}

export interface CassetteCacheView {
  readonly loaded: boolean;
  readonly keys: readonly CassetteId[];
  readonly reads: number;
  readonly hits: number;
  readonly misses: number;
  readonly networkRequests: 0;
  readonly imageUploads: 0;
  readonly providerUnits: 0;
}

function equalAuthority(left: CassetteAuthority | null, right: CassetteAuthority | null): boolean {
  return left !== null && right !== null && left.scene === right.scene
    && left.subjectId === right.subjectId && left.sourceRevision === right.sourceRevision;
}

function result(
  card: CassetteCard, status: CassetteStatus, mode: "mock" | "off",
  isCached: boolean,
): CassetteResult {
  return Object.freeze({
    kind: "beljour-cassette-result/1" as const,
    card,
    status,
    providerMode: mode,
    isCached,
    providerCalls: 0 as const,
    unitsSpent: 0 as const,
    imageSent: false as const,
    liveVerified: false as const,
  });
}

/**
 * This cache has no network client or writable external port.
 * A missing entry is a refusal, never a vendor fallback.
 */
export class DrawnCassetteCache {
  private authority: CassetteAuthority | null = null;
  private readonly entries = new Map<CassetteId, CachedEntry>();
  private reads = 0;
  private hits = 0;
  private misses = 0;
  private disposed = false;

  get snapshot(): CassetteCacheView {
    return Object.freeze({
      loaded: !this.disposed && this.authority !== null,
      keys: Object.freeze([...this.entries.keys()]),
      reads: this.reads,
      hits: this.hits,
      misses: this.misses,
      networkRequests: 0 as const,
      imageUploads: 0 as const,
      providerUnits: 0 as const,
    });
  }

  /** Cache only an authored sample that is already present in the local editor. */
  warm(state: TourState, drawnSource: boolean): boolean {
    if (this.disposed) return false;
    this.reset();
    const authority = cassetteAuthority(state);
    if (!authority || !drawnSource) return false;
    this.authority = authority;
    for (const card of CASSETTE_CARDS) {
      this.entries.set(card.id, Object.freeze({
        card,
        revision: authority.sourceRevision,
        subjectId: authority.subjectId,
      }));
    }
    return true;
  }

  peek(id: CassetteId, state: TourState, drawnSource: boolean): CassetteStatus {
    if (this.disposed) return "disposed";
    const card = cassetteById(id);
    if (!card) return "cache-miss";
    const authority = cassetteAuthority(state);
    if (!authority || !drawnSource) return "no-source";
    if (!equalAuthority(authority, this.authority)) return "invalid-source";
    const permission = cassettePermission(state, card);
    if (permission !== "ready") return permission;
    const entry = this.entries.get(id);
    if (!entry || entry.subjectId !== authority.subjectId
      || entry.revision !== authority.sourceRevision) return "cache-miss";
    return "ready";
  }

  read(id: CassetteId, state: TourState, drawnSource: boolean): CassetteResult | null {
    if (this.disposed) return null;
    const card = cassetteById(id);
    if (!card) return null;
    const status = this.peek(id, state, drawnSource);
    this.reads += 1;
    if (status === "ready") this.hits += 1;
    else this.misses += 1;
    return result(card, status, state.mockMode, status === "ready");
  }

  /** Any source, subject or consent change clears the attached cassette. */
  reset(): void {
    this.authority = null;
    this.entries.clear();
    this.reads = 0;
    this.hits = 0;
    this.misses = 0;
  }

  dispose(): void {
    if (this.disposed) return;
    this.reset();
    this.disposed = true;
  }
}
