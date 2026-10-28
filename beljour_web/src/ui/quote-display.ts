/** R8 wording for task quote status, including session limits and data flow.
 * Shared by old compatibility screens and the new task-based styling UI.
 * This only describes the server's quote; it cannot reserve units or run a task.
 * Author: John Khan.
 */
import type { Quote } from "../types.js";

export interface PriceDisplay {
  text: string;
  detail: string;
  available: boolean;
  scope: Quote["scope"];
}

function numberOfUnits(units: number): string {
  return `${units} unit${units === 1 ? "" : "s"}`;
}

export function quoteDisplay(quote: Quote): PriceDisplay {
  const { units, cached, live, scope, can_apply: available, visit_units_left: left,
    data_flow: detail, unavailable_reason: why } = quote;
  if (!Number.isInteger(units) || units < 0 || units > 10000) throw new RangeError("Unknown pricing units");
  if (scope === "local") {
    return { text: detail.includes("this server") ? "local server · free" : "on device · free", detail, available, scope };
  }
  if (scope === "recorded_only") {
    return { text: cached ? "saved result · free" : "unavailable",
      detail: !available && why ? `${detail}. ${why}` : detail, available, scope };
  }
  if (cached) {
    return { text: "saved result · free", detail, available, scope };
  }
  if (!live) {
    return { text: "demo only", detail: why ? `${detail}. ${why}` : detail, available, scope };
  }
  const budget = left === null ? "no per-visit limit" : `${Math.max(0, left)} left this visit`;
  const caution = quote.is_estimate ? " · estimate, not reserved" : "";
  return { text: `${numberOfUnits(units)} · ${budget}`, detail: `${detail}${caution}${why ? `. ${why}` : ""}`,
    available, scope };
}
