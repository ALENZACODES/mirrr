/** Layout v1 Home (layout spec §3): Rescue first, My Looks, Fix everyone, recent photos, the
 * eight-tool grid and the four-tab bar, with the Holiday Engine's "Coming up" in the editorial
 * rail (a saved look can be kept for an occasion, and then comes up for it). Photos are never stored between visits, so "recent"
 * is honest about that and offers the add tile. Every link goes into the studio with a hash
 * the editor chrome reads (#rescue, #look=<id>, #cat=<Category>, #open).
 * Author: John Khan.
 */
import { clear, h } from "../dom.js";
import { CATEGORIES, type Category, effectsIn } from "./effects.js";
import { LookStore, browserLooks, describe, exportText } from "./my-looks.js";
import { rescueLine } from "./rescue.js";
import { mountSeasonBook } from "./season-book/index.js";
import { occasions } from "./holiday/calendar.js";
import { type HolidayMount, mountHolidayEngine } from "./holiday/view.js";

export const TOOL_TILES: readonly { category: Category; title: string; line: string }[] = [
  { category: "Skin", title: "Skin", line: "Texture kept" },
  { category: "Makeup", title: "Makeup", line: "Shade match" },
  { category: "Hair", title: "Hair", line: "Style, colour, fibres" },
  { category: "Grey", title: "Grey", line: "Transition" },
  { category: "Age", title: "Age and gender", line: "Simulations" },
  { category: "Shape", title: "Shape", line: "Opt-in" },
  { category: "Photo", title: "Photo", line: "Fix, restore" },
  { category: "Filters", title: "Filters", line: "Natural looks" },
];

export function studioLink(hash: string): string {
  return `studio.html#${hash}`;
}

/** How many of a category's effects are built (for the tile's small line). */
export function builtCount(category: Category): { built: number; total: number } {
  const all = effectsIn(category);
  return { built: all.filter((e) => e.built).length, total: all.length };
}

/** "Keep for an occasion": her own choice of day for a saved look (none by default). */
function occasionPicker(holiday: HolidayMount, id: string, name: string): HTMLElement {
  const current = holiday.tags.of(id) ?? "";
  const select = h("select", { class: "lg-look-occasion", "aria-label": `Keep ${name} for an occasion` },
    h("option", { value: "", selected: current === "" }, "No occasion"),
    ...occasions().map((o) => h("option", { value: o.id, selected: o.id === current }, o.name))) as HTMLSelectElement;
  select.addEventListener("change", () => {
    if (select.value) { holiday.tags.tag(id, select.value); holiday.prefs.follow(select.value, true); }
    else holiday.tags.untag(id);
    holiday.refresh();
  });
  return h("label", { class: "lg-link" }, "For: ", select);
}

function lookCard(store: LookStore, id: string, onChange: () => void, holiday: HolidayMount | null): HTMLElement {
  const look = store.get(id)!;
  const download = h("a", { class: "lg-link", download: `${look.name.replace(/[^\w-]+/g, "-")}.look.json`,
    href: "data:application/json;charset=utf-8," + encodeURIComponent(exportText(look)) }, "Share file");
  return h("li", { class: "lg-look" },
    h("strong", { class: "lg-look-name" }, look.name),
    h("span", { class: "lg-small" }, describe(look)),
    h("span", { class: "lg-look-actions" },
      h("a", { class: "lg-button lg-primary", href: studioLink(`look=${look.id}`) }, "Apply"),
      h("a", { class: "lg-link", href: studioLink(`salon=${look.id}`) }, "Salon pack"),
      h("a", { class: "lg-link", href: studioLink(`batch=${look.id}`) }, "Apply to photos"),
      download,
      holiday ? occasionPicker(holiday, id, look.name) : null,
      h("button", { type: "button", class: "lg-link", onclick: () => { store.remove(id); onChange(); holiday?.refresh(); } }, "Remove")));
}

export function renderLooks(list: HTMLElement, store: LookStore, holiday: HolidayMount | null = null): void {
  clear(list);
  const looks = store.list();
  for (const look of looks) list.append(lookCard(store, look.id, () => renderLooks(list, store, holiday), holiday));
  const input = h("input", { type: "file", accept: "application/json,.json", class: "lg-hidden", id: "lg-import-look" }) as HTMLInputElement;
  const status = h("span", { class: "lg-small", role: "status" });
  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    try { store.importText(await file.text()); renderLooks(list, store, holiday); }
    catch (error) { status.textContent = error instanceof Error ? error.message : "That file couldn't be read."; }
  });
  list.append(h("li", { class: "lg-look lg-look-add" },
    h("a", { class: "lg-button", href: studioLink("open") }, "+ Save look"),
    h("span", { class: "lg-small" }, looks.length ? "Edit a photo, then Save as My Look." : "No saved looks yet. Edit a photo, then Save as My Look."),
    h("label", { class: "lg-link", for: "lg-import-look" }, "Import a look file"), input, status));
}

export function renderTools(grid: HTMLElement): void {
  clear(grid);
  for (const tile of TOOL_TILES) {
    const count = builtCount(tile.category);
    grid.append(h("a", { class: "lg-tool", href: studioLink(`cat=${tile.category}`) },
      h("span", { class: "lg-tool-title" }, tile.title),
      h("span", { class: "lg-small" }, tile.line),
      h("span", { class: "lg-tool-count" }, count.built ? `${count.built} of ${count.total} ready` : "Not built yet")));
  }
}

export function mountHome(doc: Document = document): { looks: LookStore } {
  const store = new LookStore(browserLooks());
  const rescue = doc.getElementById("lg-rescue-line");
  if (rescue) rescue.textContent = rescueLine();
  const holiday = mountHolidayEngine(doc, store, { store: browserLooks(), studioHref: studioLink });
  const list = doc.getElementById("lg-looks");
  if (list) renderLooks(list, store, holiday);
  const grid = doc.getElementById("lg-tools");
  if (grid) renderTools(grid);
  mountSeasonBook(doc, () => store.list());
  return { looks: store };
}

export { CATEGORIES };
