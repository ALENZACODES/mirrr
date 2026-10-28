/** Consent-bound replay and route review; never calls a provider. Author: John Khan. */
import { CASSETTE_CARDS, cassetteById, statusCopy, type CassetteId, type CassetteResult } from "./cassette-contract.js";
import { DrawnCassetteCache } from "./cassette-cache.js";
import { OfflineSampleBag, type DemoBagSnapshot } from "./cassette-bag.js";
import { safeProviderRoute, type ProviderRouteFlags, type SafeProviderLink } from "./cassette-routes.js";
import type { CassetteStatus } from "./cassette-contract.js";
import type { TourState } from "./contract.js";

export interface CassetteSessionSnapshot {
  readonly loaded: boolean;
  readonly selectedId: CassetteId | null;
  readonly observed: readonly CassetteId[];
  readonly lastResult: CassetteResult | null;
  readonly acknowledged: boolean;
  readonly providerScreensEnabled: boolean;
  readonly providerCalls: 0;
  readonly unitsSpent: 0;
  readonly imageUploaded: false;
  readonly bag: DemoBagSnapshot;
}

export interface CassetteSessionActions {
  choose(id: CassetteId, state: TourState, drawn: boolean): CassetteResult | null;
  acknowledge(checked: boolean): void;
}

export class CassetteSession {
  private readonly cache: DrawnCassetteCache;
  private readonly bag = new OfflineSampleBag();
  private readonly flags: ProviderRouteFlags;
  private readonly observed = new Set<CassetteId>();
  private selectedId: CassetteId | null = null;
  private lastResult: CassetteResult | null = null;
  private acknowledged = false;
  private disposed = false;

  constructor(providerScreensEnabled: boolean, cache: DrawnCassetteCache = new DrawnCassetteCache()) {
    this.cache = cache;
    this.flags = Object.freeze({
      providerScreensEnabled: providerScreensEnabled === true,
      acknowledgementRequired: true as const,
    });
  }

  get snapshot(): CassetteSessionSnapshot {
    return Object.freeze({
      loaded: this.cache.snapshot.loaded,
      selectedId: this.selectedId,
      observed: Object.freeze([...this.observed]),
      lastResult: this.lastResult,
      acknowledged: this.acknowledged,
      providerScreensEnabled: this.flags.providerScreensEnabled,
      providerCalls: 0 as const,
      unitsSpent: 0 as const,
      imageUploaded: false as const,
      bag: this.bag.snapshot,
    });
  }

  warm(state: TourState, drawn: boolean): boolean {
    if (this.disposed) return false;
    this.invalidate();
    return this.cache.warm(state, drawn);
  }

  /** A read is only an observation of preauthored data, never evidence of execution. */
  choose(id: CassetteId, state: TourState, drawn: boolean): CassetteResult | null {
    if (this.disposed || !cassetteById(id)) return null;
    this.selectedId = id;
    const read = this.cache.read(id, state, drawn);
    this.lastResult = read;
    if (read?.status === "ready") this.observed.add(id);
    return read;
  }

  addToBag(state: TourState, drawn: boolean): boolean {
    if (this.disposed || !this.lastResult) return false;
    if (this.cache.peek(this.lastResult.card.id, state, drawn) !== "ready") return false;
    return this.bag.add(this.lastResult);
  }

  removeFromBag(id: CassetteId): void {
    if (this.disposed) return;
    this.bag.remove(id);
  }

  acknowledge(checked: boolean): void {
    if (this.disposed) return;
    this.acknowledged = checked === true;
  }

  status(id: CassetteId, state: TourState, drawn: boolean): CassetteStatus {
    return this.cache.peek(id, state, drawn);
  }

  canRead(id: CassetteId, state: TourState, drawn: boolean): boolean {
    return !this.disposed && this.cache.peek(id, state, drawn) === "ready";
  }

  /** Link the visitor to an existing public entry point; no task can start in this tour. */
  route(state: TourState, drawn: boolean): SafeProviderLink | null {
    if (this.disposed || !this.selectedId) return null;
    const card = cassetteById(this.selectedId);
    if (!card) return null;
    if (!this.lastResult || this.lastResult.status !== "ready"
      || this.cache.peek(this.selectedId, state, drawn) !== "ready") return null;
    return safeProviderRoute(card, state, this.flags, this.acknowledged);
  }

  explanation(state: TourState, drawn: boolean): string {
    if (this.disposed) return statusCopy("disposed");
    if (this.lastResult) return statusCopy(this.cache.peek(this.lastResult.card.id, state, drawn));
    if (!drawn || !state.sourceLoaded) return statusCopy("no-source");
    return "Choose one of three cached local illustrations. No network connection is used.";
  }

  get cards(): typeof CASSETTE_CARDS {
    return CASSETTE_CARDS;
  }

  /** Always clear selections, route permission, and observational evidence on source change. */
  invalidate(): void {
    this.cache.reset();
    this.observed.clear();
    this.bag.clear();
    this.selectedId = null;
    this.lastResult = null;
    this.acknowledged = false;
  }

  dispose(): void {
    if (this.disposed) return;
    this.invalidate();
    this.cache.dispose();
    this.bag.dispose();
    this.disposed = true;
  }
}
