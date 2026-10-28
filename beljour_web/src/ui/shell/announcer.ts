/** Screen-reader announcements through one polite and one assertive live region.
 * Repeats of the same text within a second are dropped, so dragging a slider or holding an
 * arrow key doesn't flood the reader; the newest message in a burst wins. Author: John Khan.
 */
export type Politeness = "polite" | "assertive";
export type Sink = (text: string, politeness: Politeness) => void;

export class Announcer {
  private last = "";
  private lastAt = -Infinity;
  private pending: { text: string; politeness: Politeness } | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  constructor(private readonly sink: Sink, private readonly clock: () => number = () => Date.now(),
    private readonly settleMs = 120, private readonly repeatMs = 1000) {}
  say(text: string, politeness: Politeness = "polite"): void {
    const clean = text.replace(/\s+/g, " ").trim().slice(0, 300);
    if (!clean) return;
    if (clean === this.last && this.clock() - this.lastAt < this.repeatMs) return;
    this.pending = { text: clean, politeness };
    if (politeness === "assertive" || this.settleMs === 0) { this.flush(); return; }
    if (this.timer === null) this.timer = setTimeout(() => this.flush(), this.settleMs);
  }
  flush(): void {
    if (this.timer !== null) { clearTimeout(this.timer); this.timer = null; }
    const item = this.pending;
    this.pending = null;
    if (!item) return;
    this.last = item.text; this.lastAt = this.clock();
    this.sink(item.text, item.politeness);
  }
}

/** Write to a live region; clearing first makes readers repeat identical later messages. */
export function regionSink(polite: HTMLElement, assertive: HTMLElement): Sink {
  return (text, politeness) => {
    const region = politeness === "assertive" ? assertive : polite;
    region.textContent = "";
    requestAnimationFrame(() => { region.textContent = text; });
  };
}
