/** Explicit in-page Season Book alerts. No push, background work or tracking.
 * An alert cannot be emitted without a click to opt in. Author: John Khan.
 */
export interface SeasonAlert {
  seasonId: string;
  mappingVersion: string;
  count: number;
  text: "Your season match is in";
}

export class InPageSeasonAlerts {
  private enabled = false;
  private lastKey = "";

  get optedIn(): boolean {
    return this.enabled;
  }

  optInFromUserAction(): void {
    this.enabled = true;
  }

  optOut(): void {
    this.enabled = false;
    this.lastKey = "";
  }

  issue(seasonId: string, mappingVersion: string, count: number): SeasonAlert | null {
    if (!this.enabled || count === 0) {
      return null;
    }
    if (typeof seasonId !== "string" || typeof mappingVersion !== "string") {
      return null;
    }
    if (!(Number.isSafeInteger(count) && count > 0 && count <= 12)) {
      return null;
    }
    const key = `${seasonId}|${mappingVersion}|${count}`;
    if (key === this.lastKey) {
      return null;
    }
    this.lastKey = key;
    return { seasonId, mappingVersion, count, text: "Your season match is in" };
  }

  clear(): void {
    this.optOut();
  }
}
