/**
 * The Holiday Engine on Home: "Coming up", in the editorial rail's holiday slot. It shows the
 * next occasions she follows (secular ones until she chooses more), the date from the local
 * calendar (unchecked table dates say so), and one look for each: her own saved look if she kept
 * one for that day, otherwise an existing built look that opens in the studio on her photo.
 * "Choose occasions" sets the region, which days to show and Western or Orthodox dates. Nothing
 * is fetched, nothing is sent, no reminder fires: it is read when she opens Home.
 * Author: John Khan.
 */
import { clear, h } from "../../dom.js";
import type { KeyValueStore } from "../../session.js";
import type { LookStore } from "../my-looks.js";
import { type Region, localToday, occasions } from "./calendar.js";
import { type ComingUp, HolidayPrefsStore, OccasionTags, WINDOW_DAYS, comingUp, kindOf } from "./engine.js";

const REGION_NAMES: Readonly<Record<Region, string>> = { CA: "Canada", US: "United States", UK: "United Kingdom", GLOBAL: "Elsewhere" };
const VARIANT_NAMES: Readonly<Record<string, string>> = { western: "Western", orthodox: "Orthodox", day: "New Year's Day", eve: "New Year's Eve" };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "Sat 31 Oct", from a YYYY-MM-DD day, the same on every device. */
export function shortDay(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

export function whenText(item: ComingUp): string {
  const o = item.occurrence;
  const span = o.end !== o.start ? ` to ${shortDay(o.end)}` : "";
  const until = item.underWay ? "under way" : item.daysUntil === 0 ? "today" : item.daysUntil === 1 ? "tomorrow" : `in ${item.daysUntil} days`;
  return `${shortDay(o.start)}${span} · ${until}`;
}

export interface HolidayMount {
  prefs: HolidayPrefsStore;
  tags: OccasionTags;
  refresh(): void;
}

export interface HolidayOptions { store?: KeyValueStore | null; today?: () => string; studioHref?: (hash: string) => string }

function setRailVisibility(doc: Document): void {
  const rail = doc.getElementById("lg-editorial-calendar-rail");
  const holiday = doc.getElementById("lg-holiday-engine-slot");
  const season = doc.getElementById("lg-season-book-root");
  if (rail) rail.hidden = (holiday?.hidden ?? true) && (season?.hidden ?? true);
}

function item(entry: ComingUp, href: (hash: string) => string): HTMLElement {
  const s = entry.suggestion;
  const extra = s.source === "built-in" && s.needsFace ? " Needs your photo's face points, read on this device." : "";
  return h("li", { class: "lg-holiday-item" },
    h("strong", { class: "lg-holiday-name" }, entry.occurrence.name),
    h("span", { class: "lg-holiday-when" }, whenText(entry)),
    entry.dateNote ? h("span", { class: "lg-holiday-note" }, entry.dateNote) : null,
    h("span", { class: "lg-holiday-look" },
      h("a", { class: "lg-button", href: href(s.hash) }, s.source === "saved" ? `Use ${s.name}` : `Try ${s.name}`),
      h("span", { class: "lg-small" }, s.reason + extra)));
}

function chooser(prefs: HolidayPrefsStore, redraw: () => void): HTMLElement {
  const p = prefs.get();
  const region = h("select", { class: "lg-holiday-region", "aria-label": "Region" },
    ...(Object.keys(REGION_NAMES) as Region[]).map((r) => h("option", { value: r, selected: r === p.region }, REGION_NAMES[r]))) as HTMLSelectElement;
  region.addEventListener("change", () => { prefs.setRegion(region.value); redraw(); });
  const box = (id: string, name: string) => {
    const input = h("input", { type: "checkbox", class: "lg-holiday-follow", value: id, checked: p.follow.includes(id) }) as HTMLInputElement;
    input.addEventListener("change", () => { prefs.follow(id, input.checked); redraw(); });
    return h("label", { class: "lg-holiday-option" }, input, ` ${name}`);
  };
  const secular = occasions().filter((o) => kindOf(o.id) === "secular");
  const chosen = occasions().filter((o) => kindOf(o.id) !== "secular");
  const variantPickers = occasions().filter((o) => o.variants.length > 1).map((o) => {
    const current = p.variants[o.id] ?? o.defaultVariant;
    const select = h("select", { class: "lg-holiday-variant", "aria-label": `${o.name} dates` },
      ...o.variants.map((v) => h("option", { value: v, selected: v === current }, VARIANT_NAMES[v] ?? v))) as HTMLSelectElement;
    select.addEventListener("change", () => { prefs.setVariant(o.id, select.value); redraw(); });
    return h("label", { class: "lg-holiday-option" }, `${o.name}: `, select);
  });
  return h("details", { class: "lg-holiday-choose" },
    h("summary", {}, "Choose occasions"),
    h("label", { class: "lg-holiday-option" }, "Region: ", region),
    h("fieldset", { class: "lg-holiday-group" }, h("legend", {}, "Shown unless you turn them off"), ...secular.map((o) => box(o.id, o.name))),
    h("fieldset", { class: "lg-holiday-group" }, h("legend", {}, "Shown only if you choose them"),
      h("p", { class: "lg-small" }, "Cultural and religious days appear only when you tick them. The app never guesses them from you or your photo."),
      ...chosen.map((o) => box(o.id, o.name))),
    h("fieldset", { class: "lg-holiday-group" }, h("legend", {}, "Dates"), ...variantPickers),
    h("button", { type: "button", class: "lg-link", onclick: () => { prefs.reset(); redraw(); } }, "Back to the defaults"));
}

/** Paint "Coming up" into #lg-holiday-engine-slot; returns the stores and a redraw hook. */
export function mountHolidayEngine(doc: Document, looks: LookStore, options: HolidayOptions = {}): HolidayMount | null {
  const slot = doc.getElementById("lg-holiday-engine-slot");
  const store = options.store ?? null;
  const prefs = new HolidayPrefsStore(store);
  const tags = new OccasionTags(store);
  const today = options.today ?? (() => localToday());
  const href = options.studioHref ?? ((hash: string) => `studio.html#${hash}`);
  if (!slot) return null;
  const refresh = (): void => {
    tags.prune(looks.list());
    const open = slot.querySelector<HTMLDetailsElement>(".lg-holiday-choose")?.open ?? false;
    clear(slot);
    let entries: ComingUp[] = [];
    let problem = "";
    try { entries = comingUp(today(), prefs.get(), looks.list(), tags); }
    catch (error) { problem = error instanceof Error ? error.message : "The calendar couldn't be read."; }
    const body = entries.length ? h("ol", { class: "lg-holiday-list" }, ...entries.map((e) => item(e, href)))
      : h("p", { class: "lg-holiday-empty" }, problem || `Nothing you follow in the next ${WINDOW_DAYS} days.`);
    const pick = chooser(prefs, refresh);
    (pick as HTMLDetailsElement).open = open;
    slot.append(h("div", { class: "lg-holiday-frame" },
      h("header", { class: "lg-holiday-header" },
        h("h2", { class: "lg-holiday-heading" }, "Coming up"),
        h("p", { class: "lg-small" }, "From the calendar on this device. Nothing is sent anywhere.")),
      body, pick,
      h("p", { class: "lg-small lg-holiday-footnote" }, "Looks are simulations on your own photo. Your choices stay in this browser.")));
    slot.hidden = false;
    setRailVisibility(doc);
  };
  refresh();
  return { prefs, tags, refresh };
}
