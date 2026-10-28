/** Sequenced, local-only Season Book UI state. Author: John Khan.
 * The public port belongs to the owning seasonal and shade packages; this
 * client never fetches sources, guesses undertones or activates notifications.
 * Four editions a year (schedule.ts): refreshIfDue() asks the port again only when a new edition
 * has opened since the last look or the book on screen has run out.
 */
import type { MyLook } from "../my-looks.js";
import { InPageSeasonAlerts } from "./alerts.js";
import type { SeasonBook } from "./contracts.js";
import { SeasonContractError, validateSeasonBook, visibleSeasonBook } from "./contracts.js";
import type { PersonalEvidence, SeasonalMatches } from "./personal.js";
import { personalEvidence, savedLookEvidence, validateSeasonMatches } from "./personal.js";
import { type Edition, editionOn, refreshDue } from "./schedule.js";

export interface SeasonBookPort {
  loadReviewedSeason(): Promise<unknown>;
  readShadeHistory(): Promise<unknown>;
  readUndertoneProfile(): Promise<unknown>;
  matchUsingLaneF(evidence: PersonalEvidence): Promise<unknown>;
}

export type SeasonBookStatus = "not-wired" | "loading" | "ready" | "unverified" | "error";

export interface SeasonBookSnapshot {
  status: SeasonBookStatus;
  book: SeasonBook | null;
  matches: SeasonalMatches | null;
  personalizePending: boolean;
  personalized: boolean;
  alertOptedIn: boolean;
  alertMessage: string;
  statusMessage: string;
  /** The edition today falls in; edition.next is the next refresh date. */
  edition: Edition;
}

export interface SeasonClock {
  today(): string;
}

export const systemSeasonClock: SeasonClock = {
  today(): string {
    return new Date().toISOString().slice(0, 10);
  },
};

export class SeasonBookController {
  private active = true;
  private generation = 0;
  private catalogue: SeasonBook | null = null;
  private matching: SeasonalMatches | null = null;
  private status: SeasonBookStatus = "not-wired";
  private statusMessage = "Season Book is not connected to reviewed reporting.";
  private pending = false;
  private personalized = false;
  private alertMessage = "";
  private port: SeasonBookPort | null = null;
  private checkedOn: string | null = null;
  private readonly alerts = new InPageSeasonAlerts();
  private readonly subscribers = new Set<(state: SeasonBookSnapshot) => void>();

  constructor(
    private readonly savedLooks: () => readonly MyLook[],
    private readonly clock: SeasonClock = systemSeasonClock,
  ) {}

  subscribe(listener: (state: SeasonBookSnapshot) => void): () => void {
    this.subscribers.add(listener);
    listener(this.snapshot());
    return () => {
      this.subscribers.delete(listener);
    };
  }

  private emit(): void {
    const next = this.snapshot();
    for (const listener of this.subscribers) {
      listener(next);
    }
  }

  snapshot(): SeasonBookSnapshot {
    return {
      status: this.status,
      book: this.catalogue,
      matches: this.matching,
      personalizePending: this.pending,
      personalized: this.personalized,
      alertOptedIn: this.alerts.optedIn,
      alertMessage: this.alertMessage,
      statusMessage: this.statusMessage,
      edition: editionOn(this.clock.today()),
    };
  }

  async connect(port: SeasonBookPort): Promise<void> {
    if (!this.active) {
      return;
    }
    this.invalidate();
    this.port = port;
    if (typeof port.loadReviewedSeason !== "function") {
      this.status = "unverified";
      this.statusMessage = "No public Season Book source is available.";
      this.emit();
      return;
    }
    const ticket = ++this.generation;
    this.checkedOn = this.clock.today();
    this.status = "loading";
    this.statusMessage = "Checking seasonal reporting and sources.";
    this.emit();
    try {
      const raw = await port.loadReviewedSeason();
      const catalogue = visibleSeasonBook(validateSeasonBook(raw), this.clock.today());
      if (!this.current(ticket)) {
        return;
      }
      this.catalogue = catalogue;
      this.status = "ready";
      this.statusMessage = "Sourced reporting is ready for review.";
      this.emit();
    } catch (error) {
      if (!this.current(ticket)) {
        return;
      }
      this.status = error instanceof SeasonContractError ? "unverified" : "error";
      this.statusMessage = "Reviewed seasonal reporting is not available.";
      this.emit();
    }
  }

  /** Ask the connected source again if a new edition has opened since the last look or the
   * book has run out. Returns true when it asked. Never runs while a load is in flight. */
  async refreshIfDue(): Promise<boolean> {
    if (!this.active || !this.port || this.status === "loading") {
      return false;
    }
    if (!refreshDue(this.checkedOn, this.clock.today(), this.catalogue)) {
      return false;
    }
    await this.connect(this.port);
    return true;
  }

  private current(ticket: number): boolean {
    return this.active && ticket === this.generation;
  }

  private invalidate(): void {
    this.generation += 1;
    this.catalogue = null;
    this.matching = null;
    this.pending = false;
    this.personalized = false;
    this.alertMessage = "";
  }

  async personalizeFromUserAction(): Promise<void> {
    if (!this.active || this.pending || !this.catalogue || !this.port) {
      return;
    }
    const port = this.port;
    if (typeof port.readShadeHistory !== "function" ||
      typeof port.readUndertoneProfile !== "function" ||
      typeof port.matchUsingLaneF !== "function") {
      this.statusMessage = "Lane F personal matching has not been connected.";
      this.emit();
      return;
    }
    const ticket = ++this.generation;
    this.pending = true;
    this.personalized = false;
    this.matching = null;
    this.alertMessage = "";
    this.emit();
    try {
      const [history, profile] = await Promise.all([
        port.readShadeHistory(),
        port.readUndertoneProfile(),
      ]);
      if (!this.current(ticket) || !this.catalogue) {
        return;
      }
      const evidence = personalEvidence(this.catalogue, this.savedLooks(), history, profile);
      if (!evidence.undertone?.confirmed) {
        throw new SeasonContractError("profile_required", "An explicit undertone profile is required");
      }
      const raw = await port.matchUsingLaneF(evidence);
      if (!this.current(ticket)) {
        return;
      }
      const latestLooks = savedLookEvidence(this.savedLooks());
      if (JSON.stringify(latestLooks) !== JSON.stringify(evidence.savedLooks)) {
        throw new SeasonContractError("stale_saved_looks", "Saved look settings changed during matching");
      }
      const matches = validateSeasonMatches(raw, this.catalogue, evidence);
      this.matching = matches;
      this.personalized = true;
      this.statusMessage = matches.matches.length
        ? "Your season match is based on the supplied shade mapping."
        : "No supported match was returned for this profile.";
      this.alertMessage = this.alerts.issue(
        matches.seasonId,
        matches.mappingVersion,
        matches.matches.length,
      )?.text ?? "";
    } catch {
      if (!this.current(ticket)) {
        return;
      }
      this.statusMessage = "No verified personal mapping is available. Your saved looks were not changed.";
      this.matching = null;
      this.personalized = false;
    } finally {
      if (this.current(ticket)) {
        this.pending = false;
        this.emit();
      }
    }
  }

  setInPageAlertsFromUserAction(checked: boolean): void {
    if (!this.active) {
      return;
    }
    if (checked) {
      this.alerts.optInFromUserAction();
    } else {
      this.alerts.optOut();
    }
    this.alertMessage = "";
    this.emit();
  }

  resetPersonal(): void {
    this.generation += 1;
    this.pending = false;
    this.personalized = false;
    this.matching = null;
    this.alertMessage = "";
    this.emit();
  }

  disconnect(): void {
    if (!this.active) {
      return;
    }
    this.invalidate();
    this.port = null;
    this.checkedOn = null;
    this.status = "not-wired";
    this.statusMessage = "Season Book is not connected to reviewed reporting.";
    this.alerts.clear();
    this.emit();
  }

  dispose(): void {
    this.active = false;
    this.generation += 1;
    this.catalogue = null;
    this.matching = null;
    this.port = null;
    this.alerts.clear();
    this.subscribers.clear();
  }
}
