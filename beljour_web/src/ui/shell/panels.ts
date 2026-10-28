/** Phone layout: on a narrow screen the studio shows the picture plus one panel at a time,
 * chosen from a tab bar (Tools, Edit, Layers, History). On wider screens every panel shows.
 * The breakpoint matches shell.css and compare-layout.ts. Author: John Khan.
 */
import { PHONE_MAX } from "./compare-layout.js";
import { rovingIndex } from "./focus.js";

export const PANELS = ["tools", "edit", "layers", "history"] as const;
export type PanelId = typeof PANELS[number];
export const PANEL_LABELS: Readonly<Record<PanelId, string>> = { tools: "Tools", edit: "Edit", layers: "Layers", history: "History" };

export function isPhone(width: number): boolean {
  if (!Number.isFinite(width) || width <= 0) throw new RangeError("Viewport width must be positive");
  return width <= PHONE_MAX;
}

/** Which panels are visible at this width with this tab active. */
export function panelVisibility(width: number, active: PanelId): Record<PanelId, boolean> {
  const phone = isPhone(width);
  return Object.fromEntries(PANELS.map((id) => [id, !phone || id === active])) as Record<PanelId, boolean>;
}

export class PanelTabs {
  private current: PanelId;
  private readonly listeners = new Set<(id: PanelId) => void>();
  constructor(initial: PanelId = "edit") {
    if (!(PANELS as readonly string[]).includes(initial)) throw new RangeError("Unknown panel");
    this.current = initial;
  }
  get active(): PanelId { return this.current; }
  subscribe(fn: (id: PanelId) => void): () => void { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; }
  select(id: PanelId): void {
    if (!(PANELS as readonly string[]).includes(id)) throw new RangeError("Unknown panel");
    if (id === this.current) return;
    this.current = id;
    for (const fn of this.listeners) fn(id);
  }
  /** Arrow keys, Home and End move between tabs and select them (automatic activation). */
  key(key: string): PanelId | null {
    const next = rovingIndex(PANELS.length, PANELS.indexOf(this.current), key, "horizontal");
    if (next === null) return null;
    this.select(PANELS[next]);
    return this.current;
  }
  /** After a tool is chosen on a phone, show its settings. */
  followTool(): void { this.select("edit"); }
}
